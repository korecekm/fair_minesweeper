import { Component, ViewChild } from '@angular/core';
import { MinesweeperService } from './service/minesweeper-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('grid') grid;
  @ViewChild('bombCounter') bombCounter;
  @ViewChild('gameTimer') gameTimer;
  gridWidth: number;
  flagCount: number;

  constructor (private minesweeperService: MinesweeperService) {
    this.minesweeperService.clearGrid();
  }
  ngAfterViewInit() {
    this.gridWidth = this.grid.nativeElement.clientWidth - 6;
  }
  ngAfterContentInit() {
    this.clearGrid();
  }
  clearGrid() {
    if (this.gameTimer.running) this.gameTimer.stopTimer();
    this.minesweeperService.clearGrid();
    this.gameTimer.setDigits(0);
    this.bombCounter.setDigits(this.minesweeperService.bombCount);
    this.flagCount = 0;
  }

  klik(x, y) {
    if (this.minesweeperService.gameTerminated || this.minesweeperService.columnArray[x].squareArray[y].flag || this.minesweeperService.columnArray[x].squareArray[y].triggered) return;
    if (!this.minesweeperService.bombsSet) this.gameTimer.startTimer();
    this.minesweeperService.columnArray[x].squareArray[y].pressed = true;
    let change: boolean = this.minesweeperService.triggerSquare(x, y);

    if (this.minesweeperService.gameTerminated) {
      this.gameTimer.stopTimer();
      this.bombCounter.setDigits(0);
      return;
    }
    if (change) this.bombCounter.setDigits(this.minesweeperService.bombCount - this.flagCount);
    
    this.minesweeperService.evaluate();
  }
  flag(x, y) {
    if (this.minesweeperService.gameTerminated || this.minesweeperService.columnArray[x].squareArray[y].triggered) return false;
    let flagStatus = this.minesweeperService.columnArray[x].squareArray[y].flag;
    if (this.bombCounter.timerValue == 0 && !flagStatus) return false;
    this.minesweeperService.flag(x, y);
    this.minesweeperService.columnArray[x].squareArray[y].flag = !flagStatus;
    this.flagCount += (flagStatus ? -1 : 1);
    if (flagStatus) this.bombCounter.increment(); else this.bombCounter.decrement();
    if (this.minesweeperService.gameTerminated) {
      this.gameTimer.stopTimer();
      this.bombCounter.setDigits(0);
    }
    return false;
  }

  //settings a info
  settingsViewed = false; infoViewed = false;
}
