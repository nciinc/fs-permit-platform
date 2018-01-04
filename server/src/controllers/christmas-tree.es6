'use strict';

const request = require('request-promise');
const uuid = require('uuid/v4');
const xml2jsParse = require('xml2js').parseString;
const moment = require('moment');

const vcapConstants = require('../vcap-constants.es6');
const treesDb = require('../models/trees-db.es6');
const paygov = require('../paygov.es6');
const permitSvgService = require('../create-svg.es6');
const jwt = require('jsonwebtoken');
const email = require('../email/email-util.es6');

const christmasTree = {};

const translateGuidelinesFromDatabaseToClient = input => {
  return {
    forest: {
      id: input.id,
      forestName: input.forestName,
      description: input.description,
      forestAbbr: input.forestAbbr,
      forestUrl: input.forestUrl,
      orgStructureCode: input.orgStructureCode,
      treeHeight: input.treeHeight,
      stumpHeight: input.stumpHeight,
      stumpDiameter: input.stumpDiameter,
      startDate: input.startDate,
      endDate: input.endDate,
      treeCost: input.treeCost,
      maxNumTrees: input.maxNumTrees,
      allowAdditionalHeight: input.allowAdditionalHeight,
      species: input.christmasTreesForestSpecies.map(species => {
        return {
          id: species.species.id,
          name: species.species.name,
          webUrl: species.species.webUrl,
          status: species.status,
          notes: species.species.speciesNotes.map(notes => {
            return notes.note;
          })
        };
      }),
      locations: input.christmasTreesForestLocations.map(location => {
        return {
          id: location.id,
          district: location.district,
          allowed: location.allowed,
          type: location.type,
          description: location.description,
          imageFilename: location.imageFilename
        };
      })
    }
  };
};

const translatePermitFromClientToDatabase = input => {
  return {
    permitId: uuid(),
    forestId: input.forestId,
    orgStructureCode: input.orgStructureCode,
    firstName: input.firstName,
    lastName: input.lastName,
    emailAddress: input.emailAddress,
    treeCost: input.treeCost,
    quantity: input.quantity,
    totalCost: input.totalCost,
    permitExpireDate: input.expDate
  };
};

christmasTree.getForests = (req, res) => {
  treesDb.christmasTreesForests
    .findAll({
      attributes: ['id', 'forestName', 'description', 'forestAbbr']
    })
    .then(results => {
      if (results) {
        res.status(200).json(results);
      } else {
        res.status(404).send();
      }
    })
    .catch(error => {
      res.status(400).json(error);
    });
};

christmasTree.getOneGuidelines = (req, res) => {
  treesDb.christmasTreesForests
    .findOne({
      where: {
        forestAbbr: req.params.id
      },
      include: [
        {
          model: treesDb.christmasTreesForestSpecies,
          include: [
            {
              model: treesDb.species,
              include: [
                {
                  model: treesDb.speciesNotes
                }
              ]
            }
          ]
        },
        {
          model: treesDb.christmasTreesForestLocations
        }
      ],
      order: [
        [treesDb.christmasTreesForestSpecies, treesDb.species, treesDb.speciesNotes, 'display_order', 'ASC'],
        [treesDb.christmasTreesForestLocations, 'description', 'ASC'],
        [treesDb.christmasTreesForestSpecies, 'id', 'ASC']
      ]
    })
    .then(app => {
      if (app) {
        res.status(200).json(translateGuidelinesFromDatabaseToClient(app));
      } else {
        res.status(404).send();
      }
    })
    .catch(error => {
      res.status(400).json(error);
    });
};

const postPayGov = xmlData => {
  return request.post(
    {
      url: vcapConstants.payGovUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: xmlData
    },
    function(error, response, body) {
      if (!error && response.statusCode == 200) {
        return body;
      } else {
        return error;
      }
    }
  );
};

const permitResult = (permit, svgData) => {
  const result = {
    permitId: permit.permitId,
    orgStructureCode: permit.orgStructureCode,
    firstName: permit.firstName,
    lastName: permit.lastName,
    emailAddress: permit.emailAddress,
    quantity: permit.quantity,
    totalCost: permit.totalCost,
    status: permit.status,
    transactionDate: permit.updatedAt,
    permitImage: svgData ? svgData : null,
    expirationDate: permit.permitExpireDate,
    forest: {
      forestName: permit.christmasTreesForest ? permit.christmasTreesForest.forestName : null,
      forestAbbr: permit.christmasTreesForest ? permit.christmasTreesForest.forestAbbr : null
    }
  };
  return result;
};

const updatePermitWithToken = (res, permit, token) => {
  const tcsAppID = vcapConstants.payGovAppId;
  permit
    .update({
      paygovToken: token
    })
    .then(savedPermit => {
      return res.status(200).json({
        token: token,
        permitId: savedPermit.permitId,
        payGovUrl: vcapConstants.payGovClientUrl,
        tcsAppID: tcsAppID
      });
    })
    .catch(error => {
      console.error(error);
      return res.status(500).send();
    });
};

const updatePermitWithError = (res, permit, paygovError) => {
  updatePermit(permit, { status: 'Error', paygovError: JSON.stringify(paygovError) }).then(updatedPermit => {
    return getPermitError(res, updatedPermit);
  });
};

const getPermitError = (res, permit) => {
  let permitErrors = JSON.parse(permit.paygovError);
  return res.status(400).json({
    errors: [
      {
        status: 400,
        errorCode: permitErrors.errorCode[0],
        message: permitErrors.errorMessage[0],
        permit: permitResult(permit, null)
      }
    ]
  });
};

christmasTree.create = (req, res) => {
  treesDb.christmasTreesForests
    .findOne({
      where: {
        id: req.body.forestId
      }
    })
    .then(forest => {
      req.body.expDate = forest.endDate;
      treesDb.christmasTreesPermits
        .create(translatePermitFromClientToDatabase(req.body))
        .then(permit => {
          const xmlData = paygov.getXmlForToken(req.body.forestAbbr, req.body.orgStructureCode, permit);
          postPayGov(xmlData)
            .then(xmlResponse => {
              xml2jsParse(xmlResponse, function(err, result) {
                if (!err) {
                  try {
                    const token = paygov.getToken(result);
                    return updatePermitWithToken(res, permit, token);
                  } catch (error) {
                    try {
                      const paygovError = paygov.getResponseError(result);
                      return updatePermitWithError(res, permit, paygovError);
                    } catch (faultError) {
                      throwError(faultError);
                    }
                  }
                }
              });
            })
            .catch(() => {
              return res.status(500).send();
            });
        })
        .catch(error => {
          if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
              errors: error.errors
            });
          } else {
            return res.status(500).send();
          }
        });
    })
    .catch(error => {
      return res.status(400).json({
        errors: error.errors
      });
    });
};

const sendEmail = (res, savedPermit, pngBuffer) => {
  const attachments = [
    {
      filename: 'permit.png',
      content: new Buffer(pngBuffer, 'utf-8'),
      cid: 'unique@kreata.ee'
    },
    {
      filename: 'permit-attachment.png',
      content: new Buffer(pngBuffer, 'utf-8')
    }
  ];
  email.sendEmail('christmasTreesPermitCreated', savedPermit, attachments);
};

const returnSavedPermit = (res, savedPermit, svgBuffer) => {
  return res.status(200).send(permitResult(savedPermit, svgBuffer));
};

const updatePermit = (permit, updateObject) => {
  return new Promise((resolve, reject) => {
    permit
      .update(updateObject)
      .then(permit => {
        resolve(permit);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const parseXMLFromPayGov = (res, xmlResponse, permit) => {
  return new Promise((resolve, reject) => {
    xml2jsParse(xmlResponse, (err, result) => {
      if (err) {
        reject(err);
      } else {
        try {
          const paygovTrackingId = paygov.getTrackingId(result);
          resolve(paygovTrackingId);
        } catch (error) {
          try {
            const paygovError = paygov.getResponseError(result);
            return updatePermitWithError(res, permit, paygovError);
          } catch (faultError) {
            reject(faultError);
          }
        }
      }
    });
  });
};

const throwError = err => {
  throw new Error(err);
};

const checkPermitValid = permitExpireDate => {
  return moment(permitExpireDate).isAfter(moment());
};

christmasTree.getOnePermit = (req, res) => {
  treesDb.christmasTreesPermits
    .findOne({
      where: {
        permitId: req.params.id
      },
      include: [
        {
          model: treesDb.christmasTreesForests
        }
      ]
    })
    .then(permit => {
      if (permit && permit.status === 'Error') {
        return getPermitError(res, permit);
      } else if (permit && permit.status === 'Initiated') {
        const xmlData = paygov.getXmlToCompleteTransaction(permit.paygovToken);
        debugger;
        postPayGov(xmlData).then(xmlResponse => {
          parseXMLFromPayGov(res, xmlResponse, permit)
            .then(paygovTrackingId => {
              return updatePermit(permit, { paygovTrackingId: paygovTrackingId, status: 'Completed' });
            })
            .then(updatedPermit => {
              permitSvgService.generatePermitSvg(updatedPermit).then(permitSvgBuffer => {
                permitSvgService.generatePermitPng(permitSvgBuffer).then(permitPngBuffer => {
                  updatedPermit.permitUrl = paygov.createSuccessUrl(
                    permit.christmasTreesForest.forestAbbr,
                    permit.permitId
                  );
                  sendEmail(res, updatedPermit, permitPngBuffer);
                });
                returnSavedPermit(res, updatedPermit, permitSvgBuffer);
              });
            })
            .catch(error => {
              throwError(error);
            });
        });
      } else if (permit && permit.status === 'Completed') {
        const token = req.query.t;
        jwt.verify(token, vcapConstants.permitSecret, function(err, decoded) {
          if (decoded) {
            if (checkPermitValid(permit.permitExpireDate)) {
              permitSvgService.generatePermitSvg(permit).then(permitSvgBuffer => {
                returnSavedPermit(res, permit, permitSvgBuffer);
              });
            } else {
              returnSavedPermit(res, permit, null);
            }
          } else {
            return res.status(404).send();
          }
        });
      }
    })
    .catch(error => {
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          errors: error.errors
        });
      } else {
        return res.status(500).send();
      }
    });
};

christmasTree.getOnePermitDetail = (req, res) => {
  treesDb.christmasTreesPermits
    .findOne({
      where: {
        permitId: req.params.id
      }
    })
    .then(permit => {
      if (permit.status === 'Completed' || permit.status === 'Canceled') {
        res.status(404).send();
      } else {
        res.status(200).json(permit);
      }
    })
    .catch(() => {
      res.status(404).send();
    });
};

christmasTree.cancelOne = (req, res) => {
  treesDb.christmasTreesPermits
    .findOne({
      where: {
        permitId: req.body.permitId
      }
    })
    .then(permit => {
      if (permit.status !== 'Initiated') {
        res.status(404).send();
      } else {
        permit
          .update({
            status: 'Canceled'
          })
          .then(res.status(200).json(permit));
      }
    })
    .catch(() => {
      res.status(404).send();
    });
};
module.exports = christmasTree;
