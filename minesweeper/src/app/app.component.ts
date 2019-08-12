import { Component, ViewChild } from '@angular/core';
import { MinesweeperService } from './service/minesweeper-service';
import { Settings } from './service/settings';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild('bombCounter') bombCounter;
  @ViewChild('gameTimer') gameTimer;
  gridWidth: number;
  flagCount: number;

  //settings:
  public rowCount: number = 16;
  public columnCount: number = 16;
  public bombCount: number = 40;
  //specialni chovani:
  public removeMines: boolean = true;
  public addMines: boolean = true;
  public showLikelihood: boolean = false;

  constructor (private minesweeperService: MinesweeperService) {
    this.minesweeperService.clearGrid(this.rowCount, this.columnCount, this.bombCount, this.removeMines, this.addMines, this.showLikelihood);
  }
  ngAfterContentInit() {
    this.clearGrid();
  }
  clearGrid() {
    if (this.gameTimer.running) this.gameTimer.stopTimer();
    this.minesweeperService.clearGrid(this.rowCount, this.columnCount, this.bombCount, this.removeMines, this.addMines, this.showLikelihood);
    this.gameTimer.setDigits(0);
    this.bombCounter.setDigits(this.minesweeperService.bombCount);
    this.flagCount = 0;

    this.gridWidth = 26 * this.columnCount - 6;
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

  dimensions = [ "Začátečník", "Střední", "Expert", "Vlastní" ]
  model = new Settings(this.dimensions[1], 16, 16, 40, true, true, false);

  settingsSubmit() {
    this.removeMines = this.model.remove;
    this.addMines = this.model.add;
    this.showLikelihood = this.model.show;

    if (this.model.dimensions == this.dimensions[3]) {
      //X
      if (this.model.X == null) this.model.X = 16;
      this.model.X = Math.floor(this.model.X);
      if (this.model.X < 8) this.model.X = 8;
      else if (this.model.X > 60) this.model.X = 60;
      //Y
      if (this.model.Y == null) this.model.Y = 16;
      this.model.Y = Math.floor(this.model.Y);
      if (this.model.Y < 8) this.model.Y = 8;
      else if (this.model.Y > 100) this.model.Y = 100;
      //M
      if (this.model.M == null) this.model.M = this.model.X * this.model.Y / 6;
      this.model.M = Math.floor(this.model.M);
      if (this.model.M < 0) this.model.M = 10;
      else if (this.model.M > 999 || this.model.M > (this.model.X-1)*(this.model.Y-1)) this.model.M = Math.min(999, (this.model.X-1)*(this.model.Y-1));

      //nastav zadane hodnoty
      this.rowCount = this.model.Y;
      this.columnCount = this.model.X;
      this.bombCount = this.model.M;
    } else this.setStandardDimensions();
  }
  setStandardDimensions() {
    switch (this.model.dimensions) {
      case this.dimensions[0]: {
        this.rowCount = 8;
        this.columnCount = 8;
        this.bombCount = 10
        break;
      }
      case this.dimensions[1]: {
        this.rowCount = 16;
        this.columnCount = 16;
        this.bombCount = 40
        break;
      }
      case this.dimensions[2]: {
        this.rowCount = 24;
        this.columnCount = 24;
        this.bombCount = 90
      }
    }
  }
}
