import { Component, OnInit, Input } from '@angular/core';
import { SquareInfo } from '../../service/square_info';

@Component({
  selector: 'app-square',
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.css']
})
export class SquareComponent implements OnInit {
  @Input() data: SquareInfo;

  constructor() { }
  ngOnInit() { }

  triggeredBackground() {
    if (this.data.bomb && this.data.pressed) return '#eb3127';
    return '#c0c0c0';
  }

  imgPath() {
    if (this.data.bomb) return 'assets/images/bomb.svg'
    if (this.data.flag) return 'assets/images/no_bomb.svg'
    if (this.data.num == 0) return '';
    return 'assets/images/n' + this.data.num + '.svg';
  }
}
