import { ColumnInfo } from "./column_info";
import { Injectable } from "../../../node_modules/@angular/core";
import { MSList } from "./ms_list";

@Injectable()
export class MinesweeperService {
    public gameTerminated: boolean;
    public smileyType: string;
    public bombsSet: boolean;
    public rowCount: number = 16;
    public columnCount: number = 16;
    public bombCount: number = 40;

    /*
    Mine 2.9 urovne:
    beginner: 8x8, 10
    intermediate: 16x16, 40
    expert: 24x24, 99
    */

    public columnArray: ColumnInfo[];

    //manipulace s 'idle' policky:
    private bomblessList: MSList;
    private idleCount: number;
    private flaggedBombCount: number;

    constructor() {
        this.bomblessList = new MSList();
    }


    public clearGrid() {
        this.columnArray = [];
        for (let i = 0; i < this.columnCount; i++) {
            this.columnArray.push(new ColumnInfo(i, this.rowCount));
        }
        this.gameTerminated = false;
        this.bombsSet = false;
        this.idleCount = this.rowCount * this.columnCount;
        this.flaggedBombCount = 0;
        this.smileyType = 'standard';
    }
    private setBombsRandomly(x, y) {
        this.fillIdleList(x, y);
        for (let i = 0; i < this.bombCount; i++) {
            let randIdx = Math.round(Math.random() * (this.bomblessList.size - 1));
            let xy = this.bomblessList.get(randIdx);
            this.columnArray[xy[0]].squareArray[xy[1]].bomb = true;
            this.bomblessList.remove(randIdx);
        }
        this.bombsSet = true;
    }
    private fillIdleList(x, y) {  //naplni 'idleList' vsemi policky krome zadaneho
        this.bomblessList.clear();
        for (let i = 0; i < this.columnCount; i++) {
            for (let j = 0; j < this.rowCount; j++) {
                if (i != x || j != y) this.bomblessList.add(i, j);
            }
        }
    }

    public flag(x, y) {
        if (this.columnArray[x].squareArray[y].bomb) this.flaggedBombCount += (this.columnArray[x].squareArray[y].flag ? -1 : 1);
        if (this.flaggedBombCount == this.bombCount) this.gameWon();
    }
    public triggerSquare(x, y) {
        if (this.columnArray[x].squareArray[y].triggered) return;
        if (!this.bombsSet) this.setBombsRandomly(x, y);
        this.columnArray[x].squareArray[y].triggered = true;
        if (this.columnArray[x].squareArray[y].bomb) {
            //TODO: pokud nemel sanci vedet o bombe, nebude tu
            this.gameLost();
            return;
        } else {
            //TODO: pokud hloupy tah, bude zde bomba
            this.columnArray[x].squareArray[y].num = this.getNeighborBombCount(x, y);
            if (this.columnArray[x].squareArray[y].num == 0) this.triggerNeighbors(x, y);
        }
        this.idleCount--;
        if (this.idleCount == this.bombCount) this.gameWon();
    }
    private getNeighborBombCount(x, y): number {
        let neighborIndexes = [ [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1] ];
        let total = 0;
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            if (this.columnArray[neighbor[0]].squareArray[neighbor[1]].bomb) total++;
        }
        return total;
    }
    private triggerNeighbors(x, y) {
        let neighborIndexes = [ [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1] ];
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            this.triggerSquare(neighbor[0], neighbor[1]);
        }
    }

    private gameLost() {
        this.gameTerminated = true;
        this.smileyType = 'loss';
        for (let i = 0; i < this.columnCount; i++) {
            for (let j = 0; j < this.rowCount; j++) {
                if (this.columnArray[i].squareArray[j].flag && this.columnArray[i].squareArray[j].bomb) continue;
                if (!this.columnArray[i].squareArray[j].bomb && !this.columnArray[i].squareArray[j].triggered) this.columnArray[i].squareArray[j].num = this.getNeighborBombCount(i, j);
                this.columnArray[i].squareArray[j].triggered = true;
            }
        }
    }
    private gameWon() {
        this.gameTerminated = true;
        this.smileyType = 'win';
        for (let i = 0; i < this.columnCount; i++) {
            for (let j = 0; j < this.rowCount; j++) {
                if (this.columnArray[i].squareArray[j].bomb) this.columnArray[i].squareArray[j].flag = true;
                else if (!this.columnArray[i].squareArray[j].triggered) {
                    this.columnArray[i].squareArray[j].triggered = true;
                    this.columnArray[i].squareArray[j].num = this.getNeighborBombCount(i, j);
                }
            }
        }
    }
}