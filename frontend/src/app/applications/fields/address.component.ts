import { Component, Input, OnInit  } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ApplicationFieldsService } from '../_services/application-fields.service';

@Component({
  providers: [ ApplicationFieldsService ],
  selector: 'app-address',
  templateUrl: './address.component.html',
})

export class AddressComponent implements OnInit {
  @Input() parentForm: FormGroup;
  address: FormGroup;
  @Input() formName: string;
  @Input() type: string;

  states = [
    {short: 'AK', long: 'Alabama'},
    {short: 'AL', long: 'Alaska'},
    {short: 'AR', long: 'Arizona'},
    {short: 'AZ', long: 'Arkansas'},
    {short: 'CA', long: 'California'},
    {short: 'CO', long: 'Colorado'},
    {short: 'CT', long: 'Connecticut'},
    {short: 'DE', long: 'Delaware'},
    {short: 'FL', long: 'Florida'},
    {short: 'GA', long: 'Georgia'},
    {short: 'HI', long: 'Hawaii'},
    {short: 'ID', long: 'Idaho'},
    {short: 'IL', long: 'Illinois'},
    {short: 'IN', long: 'Indiana'},
    {short: 'IA', long: 'Iowa'},
    {short: 'KS', long: 'Kansas'},
    {short: 'KY', long: 'Kentucky'},
    {short: 'LA', long: 'Louisiana'},
    {short: 'ME', long: 'Maine'},
    {short: 'MD', long: 'Maryland'},
    {short: 'MA', long: 'Massachusetts'},
    {short: 'MI', long: 'Michigan'},
    {short: 'MN', long: 'Minnesota'},
    {short: 'MS', long: 'Mississippi'},
    {short: 'MO', long: 'Missouri'},
    {short: 'MT', long: 'Montana'},
    {short: 'NE', long: 'Nebraska'},
    {short: 'NV', long: 'Nevada'},
    {short: 'NH', long: 'New Hampshire'},
    {short: 'NJ', long: 'New Jersey'},
    {short: 'NM', long: 'New Mexico'},
    {short: 'NY', long: 'New York'},
    {short: 'NC', long: 'North Carolina'},
    {short: 'ND', long: 'North Dakota'},
    {short: 'OH', long: 'Ohio'},
    {short: 'OK', long: 'Oklahoma'},
    {short: 'OR', long: 'Oregon'},
    {short: 'PA', long: 'Pennsylvania'},
    {short: 'RI', long: 'Rhode Island'},
    {short: 'SC', long: 'South Carolina'},
    {short: 'SD', long: 'South Dakota'},
    {short: 'TN', long: 'Tennessee'},
    {short: 'TX', long: 'Texas'},
    {short: 'UT', long: 'Utah'},
    {short: 'VT', long: 'Vermont'},
    {short: 'VA', long: 'Virginia'},
    {short: 'WA', long: 'Washington'},
    {short: 'WV', long: 'West Virginia'},
    {short: 'WI', long: 'Wisconsin'},
    {short: 'WY', long: 'Wyoming'}
  ];

  constructor(private formBuilder: FormBuilder, private applicationFieldsService: ApplicationFieldsService) {}

  ngOnInit() {
    this.applicationFieldsService.addAddress(this.parentForm, this.formName);
  }
}
