import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SquareComponent } from './components/square/square.component';
import { TimerComponent } from './components/timer/timer.component';
import { MinesweeperService } from './service/minesweeper-service';

@NgModule({
  declarations: [
    AppComponent,
    SquareComponent,
    TimerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [ MinesweeperService ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
