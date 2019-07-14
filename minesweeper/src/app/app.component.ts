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
  }

  klik(x, y) {
    if (this.minesweeperService.gameTerminated || this.minesweeperService.columnArray[x].squareArray[y].flag || this.minesweeperService.columnArray[x].squareArray[y].triggered) return;
    if (!this.minesweeperService.bombsSet) this.gameTimer.startTimer();
    this.minesweeperService.columnArray[x].squareArray[y].pressed = true;
    this.minesweeperService.triggerSquare(x, y);

    if (this.minesweeperService.gameTerminated) this.gameTimer.stopTimer();
    //sem asi prijde nejaky 'evaluation' kod
  }
  flag(x, y) {
    if (this.minesweeperService.gameTerminated || this.minesweeperService.columnArray[x].squareArray[y].triggered) return false;
    let flagStatus = this.minesweeperService.columnArray[x].squareArray[y].flag;
    if (this.bombCounter.timerValue == 0 && !flagStatus) return false;
    this.minesweeperService.flag(x, y);
    this.minesweeperService.columnArray[x].squareArray[y].flag = !flagStatus;
    if (flagStatus) this.bombCounter.increment(); else this.bombCounter.decrement();
    if (this.minesweeperService.gameTerminated) this.gameTimer.stopTimer();
    return false;
  }

  //settings a info
  settingsViewed = false; infoViewed = false;
}
