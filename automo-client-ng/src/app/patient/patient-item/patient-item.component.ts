import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-patient-item',
  templateUrl: './patient-item.component.html',
  styleUrls: ['./patient-item.component.css']
})
export class PatientItemComponent implements OnInit {
  public name: string;
  public age: number;

  constructor() { }

  ngOnInit(): void {
    this.name = 'Ali Aafee';
    this.age = 34;
  }

  doSomething(event): void {
    console.log("yo", event)
  }

}
