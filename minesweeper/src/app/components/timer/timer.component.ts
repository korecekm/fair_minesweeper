import { Component, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css']
})
export class TimerComponent implements OnInit {
  timerValue: number = 0;
  running: boolean;
  num1: number;
  num2: number;
  num3: number;
  digit1: string;
  digit2: string;
  digit3: string;
  interval = interval(1000);
  sub: Subscription;

  constructor() {
    this.running = false;
  }
  ngOnInit() { }

  startTimer() {
    this.sub = this.interval.subscribe(val => this.increment());
    this.running = true;
  }
  stopTimer() {
    this.sub.unsubscribe();
    this.running = false;
  }

  setDigits(value: number) {
    this.timerValue = value;
    this.num1 = 0;
    this.num2 = 0;
    this.num3 = value % 10;
    if (value < 10) {
      this.refresh();
      return;
    }
    let v = (value - (value % 10)) / 10;
    this.num2 = v % 10;
    if (value < 100) {
      this.refresh();
      return;
    }
    this.num1 = (v - (v % 10)) / 10;
    this.refresh();
  }

  increment() {
    if (this.num3 != 9) {
      this.num3++;
    } else {
      this.num3 = 0;
      if (this.num2 != 9) {
        this.num2++;
        this.refresh2();
      } else {
        if (this.num1 == 9) {
          this.setOverflow();
          return;
        }
        this.num2 = 0
        this.num1++;
        this.refresh1();
        this.refresh2();
      }
    }
    this.refresh3();
    this.timerValue++;
  }
  decrement() {
    if (this.timerValue == 0) return;
    if (this.num3 != 0) {
      this.num3--;
    } else {
      this.num3 = 9;
      if (this.num2 != 0) {
        this.num2--;
        this.refresh2();
      } else {
        this.num2 = 9;
        this.num1--;
        this.refresh1();
        this.refresh2();
      }
    }
    this.refresh3();
    this.timerValue--;
  }
  setOverflow() {
    this.stopTimer();
    this.timerValue = 1000;
    this.digit1 = 'assets/images/timer/digit-overflow.svg';
    this.digit2 = 'assets/images/timer/digit-overflow.svg';
    this.digit3 = 'assets/images/timer/digit-overflow.svg';
  }

  refresh() {
    this.refresh1();
    this.refresh2();
    this.refresh3();
  }
  refresh1() {
    this.digit1 = 'assets/images/timer/d' + this.num1 + '.svg'
  }
  refresh2() {
    this.digit2 = 'assets/images/timer/d' + this.num2 + '.svg'
  }
  refresh3() {
    this.digit3 = 'assets/images/timer/d' + this.num3 + '.svg'
  }

}
