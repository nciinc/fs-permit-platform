import { TestBed, async, inject } from '@angular/core/testing';
import { HttpModule, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';
import { MockBackend } from '@angular/http/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import * as sinon from 'sinon';
import { ChristmasTreesApplicationService } from './christmasTreesApplication.service';

describe('Christmas Trees Application Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule, HttpClientTestingModule, RouterTestingModule],
      providers: [ChristmasTreesApplicationService, { provide: XHRBackend, useClass: MockBackend }]
    });
  });

  it(
    'should call create',
    inject([ChristmasTreesApplicationService], service => {
      const spy = sinon.spy(service, 'create');
      service.create({}, 'noncommercial', true);
      expect(spy.called).toBeTruthy();
    })
  );

  it(
    'should call handleStatusCode',
    inject([ChristmasTreesApplicationService], service => {
      const spy = sinon.spy(service, 'handleStatusCode');
      service.handleStatusCode(403);
      service.handleStatusCode(402);
      expect(spy.calledTwice).toBeTruthy();
    })
  );

  it(
    'should call handleStatusCode',
    inject([ChristmasTreesApplicationService], service => {
      const spy = sinon.spy(service, 'handleError');
      service.handleError('error');
      service.handleError(
        new Response(
          new ResponseOptions({
            body: JSON.stringify({ test: 'data' })
          })
        )
      );
      service.handleError(
        new Response(
          new ResponseOptions({
            body: JSON.stringify({}),
            status: 403
          })
        )
      );
      expect(spy.calledThrice).toBeTruthy();
    })
  );
});
