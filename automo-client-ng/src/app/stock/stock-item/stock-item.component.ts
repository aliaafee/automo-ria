import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-stock-item',
  templateUrl: './stock-item.component.html',
  styleUrls: ['./stock-item.component.css']
})
export class StockItemComponent implements OnInit {
  public name: string;
  public age: number;

  constructor() { }

  ngOnInit(): void {
    this.name = 'Johnny Boy';
    this.age = 85;
  }

}
