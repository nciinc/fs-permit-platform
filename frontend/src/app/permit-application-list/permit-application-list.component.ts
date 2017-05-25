import { Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../admin/application.service';

@Component({
  selector: 'app-permit-application-list',
  templateUrl: './permit-application-list.component.html',
  providers: [ ApplicationService ],
  styleUrls: ['./permit-application-list.component.scss'],
})

@Injectable()
export class PermitApplicationListComponent implements OnInit {

  applications: any;
  apiErrors: any;


  constructor( private applicationService: ApplicationService ) { }

  getApplications() {
    this.applicationService.get()
      .subscribe(
        (applications: any) => {
          console.log('success');
          this.applications =  applications;
        },
        (e: any) => {
          this.apiErrors =  e;
          window.scroll(0, 0);
        }
      );
  }

  ngOnInit() {

  }

}
