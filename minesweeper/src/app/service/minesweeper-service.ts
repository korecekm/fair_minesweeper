import { ColumnInfo } from "./column_info";
import { Injectable } from "../../../node_modules/@angular/core";
import { MSList } from "./ms_list";
import { SquareInfo } from "./square_info";
import { EvaluationData } from "./evaluation_data";
import { EvaluationDataSimple } from "./evaluation_data-simple";
import { EvaluationDataComposite } from "./evaluation_data-composite";

@Injectable()
export class MinesweeperService {
    public gameTerminated: boolean;
    public smileyType: string;
    public bombsSet: boolean;
    public rowCount: number = 16;
    public columnCount: number = 16;
    public bombCount: number = 40;
    //nastaveni specialniho chovani:
    public removeMines: boolean = true;     //maji se miny odstranovat, pokud uzivatel nemuze vedet, ze tam bomba je?
    public addMines: boolean = true;        //maji se miny pridavat pri spatnych tazich hrace?
    public showLikelihood: boolean = true;  //maji se policka barvit podle pravdepodobnosti?

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
        this.numList = new MSList();
        this.remainingStateSet = false;
        this.safeCount = 0;
        this.eliminatedBombCount = 0;
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
    /**
     * vrati true, pokud byl zmenen pocet min
     */
    public triggerSquare(x, y): boolean {
        let change: boolean = false;
        if (this.columnArray[x].squareArray[y].triggered) return false;
        if (!this.bombsSet) this.setBombsRandomly(x, y);
        this.columnArray[x].squareArray[y].triggered = true;
        if (this.columnArray[x].squareArray[y].bomb) {
            //zadna bomba, pokud zadne 'safe'
            if (this.removeMines && this.safeCount == 0 && this.columnArray[x].squareArray[y].state == SquareInfo.State.Any) {
                change = this.rearrangeAdjacentComponent(x, y);
                this.columnArray[x].squareArray[y].num = this.getNeighborBombCount(x, y);
                if (this.columnArray[x].squareArray[y].num == 0) this.triggerNeighbors(x, y);
                else this.numList.add(x, y);
            } else {
                this.gameLost();
                return false;
            }
        } else {
            //bomba v pripade hloupeho tahu
            if (this.addMines && this.safeCount != 0 && this.columnArray[x].squareArray[y].pressed && this.columnArray[x].squareArray[y].state != SquareInfo.State.Safe) {
                this.rearrangeAdjacentComponent(x, y);
                this.gameLost();
                return false;
            }
            if (this.columnArray[x].squareArray[y].state == SquareInfo.State.Safe) this.safeCount--;
            this.columnArray[x].squareArray[y].num = this.getNeighborBombCount(x, y);
            if (this.columnArray[x].squareArray[y].num == 0) this.triggerNeighbors(x, y);
            else this.numList.add(x, y);
        }
        this.idleCount--;
        if (this.idleCount == this.bombCount) this.gameWon();
        return change;
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


    //EVALUATION:
    private numList: MSList;
    private componentIdles: MSList[];
    private componentNums: MSList[];
    private componentEvalData: EvaluationData[];

    private safeCount: number;
    private eliminatedBombCount: number;
    //util:
    private evalBombArray: boolean[];

    /**
     * metoda zajistujici samotnou 'spravedlnost'
     * dostane policko, ktere je treba zmenit na obracenou hodnotu (tzn. mina tu prestane, nebo zacne byt).
     * Pokud se tim zmeni celkovy pocet min (coz nastane jen pokud by se jinak muselo zasahovat i do jinych komponent nez do primo dotcene), vrati true.
     */
    private rearrangeAdjacentComponent(x, y): boolean {  //pozor! muze se zmenit flaggedBombCount
        for (let i = 0; i < this.numList.size; i++) {
            let xy = this.numList.get(i);
            this.columnArray[xy[0]].squareArray[xy[1]].found = false;
        }
        for (let i = 0; i < this.componentIdles.length; i++) {
            for (let j = 0; j < this.componentIdles[i].size; j++) {
                let xy = this.componentIdles[i].get(j);
                this.columnArray[xy[0]].squareArray[xy[1]].found = false;
            }
        }
        this.columnArray[x].squareArray[y].bomb = !this.columnArray[x].squareArray[y].bomb;
        this.columnArray[x].squareArray[y].evalBomb = this.columnArray[x].squareArray[y].bomb;
        this.columnArray[x].squareArray[y].found = true;
        
        let componentIdles: MSList = new MSList();
        let componentNums: MSList = new MSList();
        let neighborIndexes = [ [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1] ];
        this.dfsNeighborNums(x, y, componentIdles, componentNums);
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            if (!this.columnArray[neighbor[0]].squareArray[neighbor[1]].triggered
                && this.columnArray[neighbor[0]].squareArray[neighbor[1]].state == SquareInfo.State.Any) this.dfsNeighborNums(neighbor[0], neighbor[1], componentIdles, componentNums);
        }
        if(componentNums.size == 0) {
            let res = this.addRemoveRemaining(this.columnArray[x].squareArray[y].bomb, 1);
            return (res == 0);
        }
        for (let i = 0; i < componentIdles.size; i++) {
            let xy = componentIdles.get(i);
            if (this.columnArray[xy[0]].squareArray[xy[1]].flag && this.columnArray[xy[0]].squareArray[xy[1]].bomb) this.flaggedBombCount--;
        }
        let originalBombCount = this.countComponentBombs(componentIdles) + (this.columnArray[x].squareArray[y].bomb ? 0 : 1);
        if (this.columnArray[x].squareArray[y].bomb) this.columnArray[x].squareArray[y].triggered = false;   //je potreba pro checkEvalLegal (byt jen pri pridavani miny)
        let newBombCount = this.setRandomBombPositions(componentNums, componentIdles) + (this.columnArray[x].squareArray[y].bomb ? 1 : 0);
        this.columnArray[x].squareArray[y].triggered = true;
        for (let i = 0; i < componentIdles.size; i++) {
            let xy = componentIdles.get(i);
            if (this.columnArray[xy[0]].squareArray[xy[1]].flag && this.columnArray[xy[0]].squareArray[xy[1]].bomb) this.flaggedBombCount++;
        }

        if (originalBombCount > newBombCount) newBombCount += this.addRemoveRemaining(false, originalBombCount - newBombCount);
        else newBombCount -= this.addRemoveRemaining(true, newBombCount - originalBombCount);
        //ve vyjimecnych pripadech se zmeni pocet min
        this.bombCount += newBombCount - originalBombCount;
        return (newBombCount != originalBombCount);
    }
    private dfsNeighborNums(x: number, y: number, componentIdles: MSList, componentNums: MSList) {
        let neighborIndexes = [ [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1] ];
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            if (this.columnArray[neighbor[0]].squareArray[neighbor[1]].num != 0) this.dfs(neighbor[0], neighbor[1], true, componentNums, componentIdles);
        }
    }
    /**
     * nastavi zadane komponente nahodne legalni rozestaveni min a vrati zvoleny pocet min
     */
    private setRandomBombPositions(nums: MSList, idles: MSList): number {
        let newCount = 0;
        //eliminate certain
        this.eliminateCertain(nums);
        for (let i = 0; i < idles.size; ) {
            let xy = idles.get(i);
            if (this.columnArray[xy[0]].squareArray[xy[1]].state != SquareInfo.State.Any) {
                if (this.columnArray[xy[0]].squareArray[xy[1]].state == SquareInfo.State.Certain) {
                    this.columnArray[xy[0]].squareArray[xy[1]].bomb = true;
                    newCount++;
                } else  this.columnArray[xy[0]].squareArray[xy[1]].bomb = false;
                idles.remove(i);
            } else i++;
        }
        if (idles.size == 0) return newCount;

        //zjisti, z kolika moznosti lze vybrat:
        let data: EvaluationData = this.divideToSubcomponents(idles, nums);
        let composite: boolean = true;
        if (data != null) this.evalComposite(data as EvaluationDataComposite);
        else {
            data = new EvaluationDataSimple(idles.size, 0);
            this.evalSimple(data as EvaluationDataSimple, idles, nums, this.countComponentBombs(idles), true, true);
            composite = false;
        }

        //set random iteration:
        let rand = Math.round(Math.random() * (data.formCountArray([], 0, idles.size) - 1));
        if (composite) newCount += this.setNthIterationComposite(rand, idles, data as EvaluationDataComposite);
        else newCount += this.setNthIterationSimple(rand, nums, idles, data as EvaluationDataSimple);

        return newCount;
    }
    //nasledujici dve metody vraci zvoleny pocet min
    setNthIterationSimple(n: number, nums: MSList, idles: MSList, data: EvaluationDataSimple): number {
        let i = 0;
        let iteration = -1;
        while (iteration + data.totalArray[i] < n) {
            iteration += data.totalArray[i];
            i++;
        }
        this.evalBombArray = [];
        for (let j = 0; j < idles.size; j++) this.evalBombArray.push(j >= idles.size - data.bombCountArray[i]);
        let contInc = true;
        while (contInc) {
            this.putEvalBombs(idles, this.evalBombArray);
            let res = this.checkEvalLegal(nums);
            if (!res[0] && !res[1]) {
                iteration++;
                if (iteration == n) break;
            }
            contInc = this.incrementEvalArray(idles.size, data.bombCountArray[i]);
        }
        for (let j = 0; j < idles.size; j++) {
            let xy = idles.get(j);
            this.columnArray[xy[0]].squareArray[xy[1]].bomb = this.evalBombArray[j];
        }

        return data.bombCountArray[i]
    }
    setNthIterationComposite(n: number, idles: MSList, data: EvaluationDataComposite): number {
        let iteration = -1;
        this.bridgeValues = [];
        for (let i = 0; i < data.bridgeList.size; i++) this.bridgeValues.push(false);
        let cont = true;
        outer: while (cont) {
            let subdata: EvaluationDataSimple[] = [];
            for (let i = 0; i < data.subcomponentEvaluation.length; i++) {
                let current: EvaluationDataSimple = data.subcomponentEvaluation[i][data.getSubcomponentIteration(this.bridgeValues, i)] as EvaluationDataSimple;
                if (current.totalArray === undefined || current.totalArray.length == 0) {
                    cont = this.incrementBridgeValues();
                    continue outer;
                }
                subdata.push(current);
            }
            let addition = 1;
            let totals: number[] = []
            for (let i = 0; i < subdata.length; i++) {
                let t = subdata[i].formCountArray([], 0, idles.size);
                addition *= t;
                totals.push(t);
            }
            if (iteration + addition >= n) {  //uz jsme dosli k pozadovane iteraci
                //ZDE SE ODEHRAVA SAMOTNE NASTAVENI:
                let bombCount = 0;
                let subiterations = this.getSubiterations(totals, n-iteration-1);
                for (let i = 0; i < data.bridgeList.size; i++) {
                    let xy = data.bridgeList.get(i);
                    this.columnArray[xy[0]].squareArray[xy[1]].bomb = this.bridgeValues[i];
                    this.columnArray[xy[0]].squareArray[xy[1]].evalBomb = this.bridgeValues[i];
                    if (this.bridgeValues[i]) bombCount++;
                }
                for (let i = 0; i < subdata.length; i++) {
                    bombCount += this.setNthIterationSimple(subiterations[i], data.subcomponentNums[i], data.subcomponentIdles[i], subdata[i]);
                }
                return bombCount;
            } else iteration += addition;
            cont = this.incrementBridgeValues();
        }
        throw new RangeError("'n' exceeded the number of legal iterations");
    }
    /**
     * vraci, kolik se povedlo odstranit/pridat
     */
    private addRemoveRemaining(remove: boolean, count: number): number {
        if (count == 0) return 0;
        let remaining: MSList = this.getRemainingList(remove);
        let i;
        for (i = 0; i < count && remaining.size > 0; i++) {
            let rand = Math.round(Math.random() * (remaining.size-1));
            let xy = remaining.get(rand);
            remaining.remove(rand);
            this.columnArray[xy[0]].squareArray[xy[1]].bomb = !remove;
            if (this.columnArray[xy[0]].squareArray[xy[1]].flag) this.flaggedBombCount += (remove ? -1 : 1);
        }
        return i;
    }
    private getRemainingList(bomb: boolean): MSList {
        for (let x = 0; x < this.columnCount; x++) {
            for (let y = 0; y < this.rowCount; y++) {
                this.columnArray[x].squareArray[y].found = false;
            }
        }
        for (let i = 0; i < this.componentIdles.length; i++) {
            for (let j = 0; j < this.componentIdles[i].size; j++) {
                let xy = this.componentIdles[i].get(j);
                this.columnArray[xy[0]].squareArray[xy[1]].found = true;
            }
        }
        let ret: MSList = new MSList();
        for (let x = 0; x < this.columnCount; x++) {
            for (let y = 0; y < this.rowCount; y++) {
                if (!this.columnArray[x].squareArray[y].triggered && this.columnArray[x].squareArray[y].state == SquareInfo.State.Any 
                    && !this.columnArray[x].squareArray[y].found && this.columnArray[x].squareArray[y].bomb == bomb) ret.add(x, y);
            }
        }
        return ret;
    }

    public evaluate() {
        if (!this.removeMines && !this.addMines && !this.showLikelihood) return;

        this.eliminateCertain(this.numList);
        //rozdel na komponenty
        let componentCount = this.divideIntoComponents();
        
        //zavolej zvlast na vsechny komponenty
        this.componentEvalData = [];
        for (let i = 0; i < componentCount; i++) {
            this.evalCompByIdx(i);
        }

        //nastav polickum pravdepodobnosti
        this.setStates();
    }

    /**
     * zaridi, ze se data ziskana z 'evaluation' pouziji na spravne prenastaveni 'states' prislusnych poicek
     */
    private setStates() {
        let componentsIdlesCount = 0;
        let minPrefixes = [];
        let maxPrefixes = [];
        if (this.componentEvalData.length != 0) {
            minPrefixes.push(this.componentEvalData[0].minMines);
            maxPrefixes.push(this.componentEvalData[0].maxMines);
            componentsIdlesCount += this.componentIdles[0].size;
        }
        for (let i = 1; i < this.componentEvalData.length; i++) {
            minPrefixes.push(minPrefixes[i-1] + this.componentEvalData[i].minMines);
            maxPrefixes.push(maxPrefixes[i-1] + this.componentEvalData[i].maxMines);
            componentsIdlesCount += this.componentIdles[i].size;
        }
        for (let i = 0; i < this.componentEvalData.length; i++) {
            let minPrefix = ((i == 0) ? 0 : minPrefixes[i-1]) + ((i == minPrefixes.length-1) ? 0 : (minPrefixes[minPrefixes.length-1] - minPrefixes[i]));
            let maxPrefix = ((i == 0) ? 0 : maxPrefixes[i-1]) + ((i == maxPrefixes.length-1) ? 0 : (maxPrefixes[maxPrefixes.length-1] - maxPrefixes[i]));
            let lower = this.bombCount - this.eliminatedBombCount - this.idleCount + componentsIdlesCount - maxPrefix;
            let upper = this.bombCount - this.eliminatedBombCount - minPrefix;

            let counts: number[] = [];
            let total = this.componentEvalData[i].formCountArray(counts, lower, upper);
            for (let j = 0; j < this.componentIdles[i].size; j++) {
                let xy = this.componentIdles[i].get(j);
                //menime jedine z Any do jineho stavu:
                if (this.columnArray[xy[0]].squareArray[xy[1]].state == SquareInfo.State.Any) {
                    if (counts[j] == 0) {
                        this.columnArray[xy[0]].squareArray[xy[1]].state = SquareInfo.State.Safe;
                        this.safeCount++;
                    } else if (counts[j] == total) {
                        this.columnArray[xy[0]].squareArray[xy[1]].state = SquareInfo.State.Certain;
                    }
                }
            }
        }
        let minPrefix = (minPrefixes.length == 0) ? 0 : minPrefixes[minPrefixes.length-1];
        let maxPrefix = (maxPrefixes.length == 0) ? 0 : maxPrefixes[maxPrefixes.length-1];
        if (this.eliminatedBombCount + minPrefix == this.bombCount) this.setRemainingState(SquareInfo.State.Safe);
        if (this.idleCount - componentsIdlesCount == this.bombCount - this.eliminatedBombCount - maxPrefix) this.setRemainingState(SquareInfo.State.Certain);
    }

    private remainingStateSet: boolean;
    private setRemainingState(state: SquareInfo.State) {  //nastavi u 'jeste neobjevenych' idle policek stav na zadany 'state' (v pripade, ze  uz to jinak byt nemuze)
        if (this.remainingStateSet) return;
        for (let i = 0; i < this.columnCount; i++) {
            for (let j = 0; j < this.rowCount; j++) {
                this.columnArray[i].squareArray[j].found = false
            }
        }    
        for (let i = 0; i < this.componentIdles.length; i++) {
            for (let j = 0; j < this.componentIdles[i].size; j++) {
                let xy = this.componentIdles[i].get(j);
                this.columnArray[xy[0]].squareArray[xy[1]].found = true;
            }
        }
        for (let i = 0; i < this.columnCount; i++) {
            for (let j = 0; j < this.rowCount; j++) {
                let square = this.columnArray[i].squareArray[j];
                if (!square.triggered && !square.found && square.state == SquareInfo.State.Any) {
                    square.state = state;
                    if (state == SquareInfo.State.Safe) this.safeCount++;
                }
            }
        }
        this.remainingStateSet = true;
    }

    private divideIntoComponents(): number { //pri uziti teto metody by mely vsechna policka v numListu sousedit s nejakymi uncertain idle policky!; vraci pocet komponent
        this.componentIdles = []; this.componentNums = [];
        this.setNotFound();
        let idx = -1;
        for (let i = 0; i < this.numList.size; i++) {
            let xy = this.numList.get(i);
            if (this.columnArray[xy[0]].squareArray[xy[1]].found) continue;
            idx++;
            this.componentIdles.push(new MSList()); //jeste sem nic nedorekurzilo
            this.componentNums.push(new MSList());  ////
            this.dfs(xy[0], xy[1], true, this.componentNums[idx], this.componentIdles[idx]);
        }
        return idx + 1;
    }
    private dfs(x: number, y: number, num: boolean, nums: MSList, idles: MSList) { //num znamena, ze 'jsme v' policku s cislem a prechazime ciste do idle policek, false naopak ze jdeme z idle do num
        if (this.columnArray[x].squareArray[y].found) return;
        this.columnArray[x].squareArray[y].found = true;
        if (num) nums.add(x, y);
        else idles.add(x, y);
        let neighborIndexes = [ [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1] ];
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            if (num && !this.columnArray[neighbor[0]].squareArray[neighbor[1]].triggered && this.columnArray[neighbor[0]].squareArray[neighbor[1]].state == SquareInfo.State.Any) this.dfs(neighbor[0], neighbor[1], false, nums, idles);
            if (!num && this.columnArray[neighbor[0]].squareArray[neighbor[1]].num != 0) this.dfs(neighbor[0], neighbor[1], true, nums, idles);
        }
    }
    private setNotFound() {  //pripravi numList na DFS k ziskani komponent (nastavenim hodnot found na false)
        for (let i = 0; i < this.numList.size; i++) {
            let xy = this.numList.get(i);
            this.columnArray[xy[0]].squareArray[xy[1]].found = false;
            let neighborIndexes = [ [xy[0] - 1, xy[1] - 1], [xy[0], xy[1] - 1], [xy[0] + 1, xy[1] - 1], [xy[0] - 1, xy[1]], [xy[0] + 1, xy[1]], [xy[0] - 1, xy[1] + 1], [xy[0], xy[1] + 1], [xy[0] + 1, xy[1] + 1] ];
            for (let neighbor of neighborIndexes) {
                if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
                this.columnArray[neighbor[0]].squareArray[neighbor[1]].found = false;
            }
        }
    }

    private eliminateCertain(nums: MSList) {  //projde numList a najde cisla, se kterymi sousedi prave tolik policek (resp. jistych policek), jake maji cislo
        while (true) {
            if (!this.eliminateType(false, nums) && !this.eliminateType(true, nums)) break;
        }
    }
    private eliminateType(type: boolean, nums: MSList): boolean {  //true pokud se povedlo eliminovat aspon jedno cislo
        let i = 0;
        let ret = false;
        while (i < nums.size) {
            let result = this.elimination(type, nums, i);
            if (result) ret = true;
            else i++;
        }
        return ret;
    }
    private elimination(type: boolean, nums: MSList, idx: number): boolean {  //type 0 zjistuje pocet non-safe sousedu, type 1 pocet certain sousedu...  VRACI true, pokud se povedlo pole eliminovat
        let count = 0;
        let xy = nums.get(idx);
        let x = xy[0];
        let y = xy[1];
        let neighborIndexes: [number, number][] = [ [x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1] ];
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            if ((!type && !this.columnArray[neighbor[0]].squareArray[neighbor[1]].triggered && this.columnArray[neighbor[0]].squareArray[neighbor[1]].state != SquareInfo.State.Safe)
            || (type && this.columnArray[neighbor[0]].squareArray[neighbor[1]].state == SquareInfo.State.Certain)) count++;
        }
        if (count == this.columnArray[x].squareArray[y].num) {
            for (let neighbor of neighborIndexes) {
                if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
                if (!type && !this.columnArray[neighbor[0]].squareArray[neighbor[1]].triggered && this.columnArray[neighbor[0]].squareArray[neighbor[1]].state == SquareInfo.State.Any) {
                    this.columnArray[neighbor[0]].squareArray[neighbor[1]].state = SquareInfo.State.Certain;
                }
                if (type && !this.columnArray[neighbor[0]].squareArray[neighbor[1]].triggered && this.columnArray[neighbor[0]].squareArray[neighbor[1]].state == SquareInfo.State.Any) {
                    this.columnArray[neighbor[0]].squareArray[neighbor[1]].state = SquareInfo.State.Safe;
                    this.safeCount++;
                }
            }
            nums.remove(idx);
            this.eliminateIdles(neighborIndexes);
            return true;
        }
        return false;
    }
    private eliminateIdles(neighborIndexes: [number, number][]) {  //potreba pro predstavu, kolik bomb uz je odhaleno
        for (let neighbor of neighborIndexes) {
            if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
            if (!this.columnArray[neighbor[0]].squareArray[neighbor[1]].eliminated && this.columnArray[neighbor[0]].squareArray[neighbor[1]].bomb) {
                this.columnArray[neighbor[0]].squareArray[neighbor[1]].eliminated = true;
                this.eliminatedBombCount++;
            }
        }
    }

    private evalCompByIdx(idx: number) {
        let data: EvaluationData = this.divideToSubcomponents(this.componentIdles[idx], this.componentNums[idx]);
        if (data != null) this.evalComposite(data as EvaluationDataComposite);
        else {
            data = new EvaluationDataSimple(this.componentIdles[idx].size, 0);
            this.evalSimple(data as EvaluationDataSimple, this.componentIdles[idx], this.componentNums[idx], this.countComponentBombs(this.componentIdles[idx]), true, true);
        }

        if (idx == this.componentEvalData.length) this.componentEvalData.push(data);
        else this.componentEvalData[idx] = data;
    }
    
    private divideToSubcomponents(idles: MSList, nums: MSList): EvaluationDataComposite {  //vrati kompozitni komponentu jako EvaluationDataComposite, nebo vrati null
        if (idles.size < 11) return null;
        for (let i = 0; i < idles.size; i++) this.columnArray[idles.get(i)[0]].squareArray[idles.get(i)[1]].index = i;
        for (let i = 0; i < nums.size; i++) {
            this.columnArray[nums.get(i)[0]].squareArray[nums.get(i)[1]].index = i;
            this.columnArray[nums.get(i)[0]].squareArray[nums.get(i)[1]].subcomponentIdx = -1;
        }
        let adjacency: Array<Array<number>> = [];  //sousednost cisel skrze idles
        this.constructNumGraph(adjacency, idles, nums);

        //napln 'subcomponentNums'
        let data = new EvaluationDataComposite();
        this.populateSubcomponentNums(data, adjacency, nums, Math.floor(nums.size*5/idles.size) + 1);

        //zkontroluj, zda se v 'subcomponentNums' nenajdou subkomponenty bez idles
        let neighborSubcomponents: number[][] = [];
        for (let i = 0; i < idles.size; i++) {
            neighborSubcomponents.push([]);
            let xy = idles.get(i);
            let neighborIndexes = [ [xy[0] - 1, xy[1] - 1], [xy[0], xy[1] - 1], [xy[0] + 1, xy[1] - 1], [xy[0] - 1, xy[1]], [xy[0] + 1, xy[1]], [xy[0] - 1, xy[1] + 1], [xy[0], xy[1] + 1], [xy[0] + 1, xy[1] + 1] ];
            for (let neighbor of neighborIndexes) {
                if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
                if (this.columnArray[neighbor[0]].squareArray[neighbor[1]].num != 0) this.addAdjacency(neighborSubcomponents[i], this.columnArray[neighbor[0]].squareArray[neighbor[1]].subcomponentIdx);
            }
        }
        outer: for (let i = 0; i < data.subcomponentNums.length; i++) {
            let neighborSubIdx: number;
            for (let j = 0; j < data.subcomponentNums[i].size; j++) {
                let xy = data.subcomponentNums[i].get(j);
                let neighborIndexes = [ [xy[0] - 1, xy[1] - 1], [xy[0], xy[1] - 1], [xy[0] + 1, xy[1] - 1], [xy[0] - 1, xy[1]], [xy[0] + 1, xy[1]], [xy[0] - 1, xy[1] + 1], [xy[0], xy[1] + 1], [xy[0] + 1, xy[1] + 1] ];
                for (let n of neighborIndexes) {
                    if (n[0] < 0 || n[0] >= this.columnCount || n[1] < 0 || n[1] >= this.rowCount) continue;
                    if (this.columnArray[n[0]].squareArray[n[1]].triggered || this.columnArray[n[0]].squareArray[n[1]].state != SquareInfo.State.Any) continue;
                    let idleIdx = this.columnArray[n[0]].squareArray[n[1]].index;
                    if (neighborSubcomponents[idleIdx].length == 1) {
                        i++;
                        continue outer;
                    }
                    else neighborSubIdx = this.getOtherIdx(neighborSubcomponents[idleIdx], i);
                }
            }
            this.moveSubNumsToOther(data, i, neighborSubIdx, neighborSubcomponents);
        }

        //ze 'subcomponentNums' odvod 'subcomponentIdles' a 'bridgeIndexes'
        if (data.subcomponentNums.length == 1) return null;  //komponentu se nepovedlo rozdelit na subkomponenty
        data.bridgeList = new MSList();
        data.subcomponentBridges = new Array<Array<number>>();
        data.subcomponentIdles = [];
        for (let i = 0; i < data.subcomponentNums.length; i++) {
            data.subcomponentBridges.push(new Array<number>());
            data.subcomponentIdles.push(new MSList());
        }
        for (let i = 0; i < idles.size; i++) {
            let xy = idles.get(i);
            if (neighborSubcomponents[i].length == 1) data.subcomponentIdles[neighborSubcomponents[i][0]].add(xy[0], xy[1]);
            else {
                let currIdx = data.bridgeList.size;
                data.bridgeList.add(xy[0], xy[1]);
                for (let j = 0; j < neighborSubcomponents[i].length; j++) this.addAdjacency(data.subcomponentBridges[neighborSubcomponents[i][j]], currIdx);
            }
        }

        //usporadej 'idles' do spravneho poradi (subkomponenta musi zacit mosty, a dal postupne vypsat komponenty)
        let ordered = new MSList();
        for (let i = 0; i < data.bridgeList.size; i++) ordered.add(data.bridgeList.get(i)[0], data.bridgeList.get(i)[1]);
        for (let i = 0; i < data.subcomponentIdles.length; i++) {
            if (data.subcomponentIdles[i].size == 0 ) return null;
            for (let j = 0; j < data.subcomponentIdles[i].size; j++) {
                let xy = data.subcomponentIdles[i].get(j);
                ordered.add(xy[0], xy[1]);
            }
        }
        idles.clear();
        for (let i = 0; i < ordered.size; i++) idles.add(ordered.get(i)[0], ordered.get(i)[1]);

        return data;
    }

    private constructNumGraph(graph: Array<Array<number>>, idles: MSList, nums: MSList) {
        let adjacentNums: Array<Array<number>> = [];  //i-ty prvek obsahuje (indexy v 'nums') cisla sousedici s i-tym idle
        for (let i = 0; i < idles.size; i++) {
            adjacentNums.push([]);
            let xy = idles.get(i);
            let neighborIndexes = [ [xy[0] - 1, xy[1] - 1], [xy[0], xy[1] - 1], [xy[0] + 1, xy[1] - 1], [xy[0] - 1, xy[1]], [xy[0] + 1, xy[1]], [xy[0] - 1, xy[1] + 1], [xy[0], xy[1] + 1], [xy[0] + 1, xy[1] + 1] ];
            for (let neighbor of neighborIndexes) {
                if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
                if (this.columnArray[neighbor[0]].squareArray[neighbor[1]].num != 0) adjacentNums[i].push(this.columnArray[neighbor[0]].squareArray[neighbor[1]].index);
            }
        }
        for (let i = 0; i < nums.size; i++) graph.push([]);
        for (let i = 0; i < idles.size; i++) {
            for (let a = 0; a < adjacentNums[i].length; a++) {
                for (let b = a+1; b < adjacentNums[i].length; b++) {
                    this.addAdjacency(graph[adjacentNums[i][a]], adjacentNums[i][b]);
                    this.addAdjacency(graph[adjacentNums[i][b]], adjacentNums[i][a]);
                }   
            }
        }
    }
    private populateSubcomponentNums(data: EvaluationDataComposite, adjacency: Array<Array<number>>, nums: MSList, smallSize: number) {
        data.subcomponentNums = [];
        if (smallSize == 1) {
            for (let i = 0; i < nums.size; i++) {
                data.subcomponentNums.push(new MSList());
                this.addToSubcomponent(data.subcomponentNums[i], nums.get(i), i);
            }
            return;
        }
        for (let i = 0; i < nums.size; i++) this.columnArray[nums.get(i)[0]].squareArray[nums.get(i)[1]].subcomponentIdx = -1;
        for (let i = 0; i < nums.size; i++) {
            //kolik ma pole kolem sebe uz vzniklych komponent a kolik volnych pozic
            let unassignedNeighbors: number[] = [];
            let neighborSubcomponents: number[]= [];
            let smallNeighbor: boolean = false;  //sousedi num s 'dost malou' subkomponentou
            neighborIdxs: for (let nIdx of adjacency[i]) {
                let currIdx = this.columnArray[nums.get(nIdx)[0]].squareArray[nums.get(nIdx)[1]].subcomponentIdx;
                if (currIdx == -1) unassignedNeighbors.push(nIdx);
                else {
                    for (let j = 0; j < neighborSubcomponents.length; j++) if (neighborSubcomponents[j] == currIdx) continue neighborIdxs;
                    neighborSubcomponents.push(currIdx);
                    if (data.subcomponentNums[currIdx].size < smallSize) smallNeighbor = true;
                }
            }
            //pripoj se (a sve unassigned sousedy) k existujici subkomponente, nebo vytvor novou
            let subIdx = this.columnArray[nums.get(i)[0]].squareArray[nums.get(i)[1]].subcomponentIdx;
            if (subIdx != -1) {
                if (data.subcomponentNums[subIdx].size > smallSize) continue;
                this.addArrayToSubcomponent(data, unassignedNeighbors, nums, subIdx)         //pripoj okolni nepripojena nums
                continue;
            }
            if (!smallNeighbor && (unassignedNeighbors.length != 0 || data.subcomponentNums.length == 0)) {
                //vytvor novou komponentu
                subIdx = data.subcomponentNums.length;
                data.subcomponentNums.push(new MSList());
                this.addToSubcomponent(data.subcomponentNums[subIdx], nums.get(i), subIdx);
                this.addArrayToSubcomponent(data, unassignedNeighbors, nums, subIdx);
                continue;
            }
            if (neighborSubcomponents.length != 0) {
                //pripoj sebe a unassigned neighbors k nejmensi sousedni komponente
                subIdx = neighborSubcomponents[0];
                let subSize = data.subcomponentNums[neighborSubcomponents[0]].size;
                for (let j = 1; j < neighborSubcomponents.length; j++) {
                    if (data.subcomponentNums[neighborSubcomponents[j]].size < subSize) {
                        subIdx = neighborSubcomponents[j];
                        subSize = data.subcomponentNums[neighborSubcomponents[j]].size;
                    }
                }
                this.addToSubcomponent(data.subcomponentNums[subIdx], nums.get(i), subIdx);
                this.addArrayToSubcomponent(data, unassignedNeighbors, nums, subIdx);
                continue;
            }
            //pripoj se k nejmensi komponente vubec
            subIdx = 0;
            let subSize = data.subcomponentNums[0].size;
            for (let j = 1; j < data.subcomponentNums.length; j++) {
                if (data.subcomponentNums[j].size < subSize) {
                    subIdx = j;
                    subSize = data.subcomponentNums[j].size;
                }
            }
            this.addToSubcomponent(data.subcomponentNums[subIdx], nums.get(i), subIdx);
        }
        if (data.subcomponentNums.length == 1) {
            data.subcomponentNums = [];
            for (let i = 0; i < nums.size; i++) {
                data.subcomponentNums.push(new MSList());
                this.addToSubcomponent(data.subcomponentNums[i], nums.get(i), i);
            }
        }
    }
    private moveSubNumsToOther(data: EvaluationDataComposite, subIdx: number, otherIdx: number, neighborSubcomponents: number[][]) {
        for (let i = 0; i < data.subcomponentNums[subIdx].size; i++) {
            data.subcomponentNums[otherIdx].add(data.subcomponentNums[subIdx].get(i)[0], data.subcomponentNums[subIdx].get(i)[1]);
        }
        data.subcomponentNums.splice(subIdx, 1);
        //oprav 'neighbor subcomponents'
        if (otherIdx > subIdx) otherIdx--;
        for (let i = 0; i < neighborSubcomponents.length; i++) {
            let newNeighbors: number[] = [];
            for (let j = 0; j < neighborSubcomponents[i].length; j++) {
                let n = neighborSubcomponents[i][j];
                if (n == subIdx) this.addAdjacency(newNeighbors, otherIdx);
                else if (n > subIdx) this.addAdjacency(newNeighbors, n-1);
                else newNeighbors.push(n);
            }
            neighborSubcomponents[i] = newNeighbors;
        }
    }

    private addArrayToSubcomponent(data: EvaluationDataComposite, array: number[], nums: MSList, subIdx: number) {
        for (let a of array) this.addToSubcomponent(data.subcomponentNums[subIdx], nums.get(a), subIdx);
    }
    private addToSubcomponent(subcomponent: MSList, xy: [number, number], subIdx: number) {
        this.columnArray[xy[0]].squareArray[xy[1]].subcomponentIdx = subIdx;
        subcomponent.add(xy[0], xy[1]);
    }
    private addAdjacency(adjacency: number[], targetIdx: number) {
        for (let i = 0; i < adjacency.length; i++) {
            if (adjacency[i] == targetIdx) return;
        }
        adjacency.push(targetIdx);
    }
    
    private bridgeValues: boolean[];
    private evalComposite(data: EvaluationDataComposite) {
        data.subcomponentEvaluation = new Array<Array<EvaluationData>>();
        for (let i = 0; i < data.subcomponentBridges.length; i++) {   //iteruj pres vsechny subkomponenty
            this.bridgeValues = [];
            for (let j = 0; j < data.subcomponentBridges[i].length; j++) this.bridgeValues.push(false);
            data.subcomponentEvaluation.push([]);
            let cont = true;
            while (cont) {
                let writeData = new EvaluationDataSimple(data.subcomponentIdles[i].size, 0);
                for (let j = 0; j < data.subcomponentBridges[i].length; j++) {
                    let xy = data.bridgeList.get(data.subcomponentBridges[i][j]);
                    this.columnArray[xy[0]].squareArray[xy[1]].evalBomb = this.bridgeValues[j];
                }
                this.evalSimple(writeData, data.subcomponentIdles[i], data.subcomponentNums[i], this.countComponentBombs(data.subcomponentIdles[i]), true, true);
                data.subcomponentEvaluation[i].push(writeData);
                cont = this.incrementBridgeValues();
            }
        }
        data.autoSetMinMax();
    }
    private incrementBridgeValues(): boolean { //po ukonceni iterace vrati false
        let i;
        for (i = 0; i < this.bridgeValues.length && this.bridgeValues[i]; i++) this.bridgeValues[i] = false;
        if (i == this.bridgeValues.length) return false;
        this.bridgeValues[i] = true;
        return true;
    }

    /**
    * (eval pro nekompozitni komponenty)
    * pokud je potreba zkusit vyssi/nizsi pocet bomb (nez zadany bombCount), zarekurzi se a zkusi i to.. ale pouze pokud je up/down true (aby se nerekurzilo donekonecna)
    */
    private evalSimple(writeData: EvaluationDataSimple, componentIdles: MSList, componentNums: MSList, bombCount: number, up: boolean, down: boolean) {
        let shouldUp = false, shouldDown = false;  //mel by se zkusit vyssi, resp. nizsi pocet bomb?
        let total = 0;
        let writeArray: number[] = [];
        this.initEval(writeArray, componentIdles.size, bombCount);
        let contInc = true;
        while (contInc) {
            this.putEvalBombs(componentIdles, this.evalBombArray);
            let res = this.checkEvalLegal(componentNums);
            if (res[0] && !res[1]) shouldUp = true;
            if (!res[0]) {
                if (res[1]) shouldDown = true;
                else {
                    this.recordEval(writeArray);
                    total++;
                }
            }
            contInc = this.incrementEvalArray(componentIdles.size, bombCount);
        }
        //zapis vysledku:
        if (total != 0) {
            if (writeData.minMines > bombCount) writeData.minMines = bombCount;
            if (writeData.maxMines < bombCount) writeData.maxMines = bombCount;
            writeData.bombCountArray.push(bombCount);
            writeData.totalArray.push(total);
            writeData.possibilityArrays.push(writeArray);
        }

        if (up && shouldUp && bombCount < componentIdles.size) this.evalSimple(writeData, componentIdles, componentNums, bombCount + 1, true, false);
        if (down && shouldDown && bombCount > 0) this.evalSimple(writeData, componentIdles, componentNums, bombCount - 1, false, true);
    }


    // UTIL:

    private recordEval(writeArray: number[]) {
        for (let i = 0; i < writeArray.length; i++) {
            if (this.evalBombArray[i]) writeArray[i]++;
        }
    }
    private countComponentBombs(component: MSList) {
        let count = 0;
        for (let i = 0; i < component.size; i++) {
            let xy = component.get(i);
            if (this.columnArray[xy[0]].squareArray[xy[1]].bomb) count++;
        }
        return count;
    }
    private initEval(writeArray: number[], componentSize: number, bombCount: number) {
        this.evalBombArray = [];
        for (let i = 0; i < componentSize; i++) {
            writeArray.push(0);
            this.evalBombArray.push((i >= componentSize - bombCount));
        }
    }
    private incrementEvalArray(componentSize: number, bombCount: number): boolean {   //vrati false, pokud je iterovani dokonceno (tzn. true pokud ma smysl nove rozestaveni zkouset)
        if (bombCount == 0) return false;
        if (!this.evalBombArray[0]) {
            for (let i = 1; i < componentSize; i++) {
                if (!this.evalBombArray[i]) continue;
                this.evalBombArray[i] = false;
                this.evalBombArray[i-1] = true;
                return true;
            }
        }
        if (bombCount == 1) return false;
        let i = 1;
        let prevCount = 1;
        this.evalBombArray[0] = false;
        while (this.evalBombArray[i]) {
            if (prevCount >= bombCount - 1) return false;
            this.evalBombArray[i] = false;
            i++; prevCount++;
        }
        for (i++; i < componentSize; i++) {
            if (this.evalBombArray[i]) break;
        }
        this.evalBombArray[i] = false;
        for (let j = 0; j < prevCount+1; j++) {
            this.evalBombArray[i-j-1] = true;
        }
        return true;
    }
    private putEvalBombs(component: MSList, evalArray: boolean[]) {
        for (let i = 0; i < component.size; i++) {
            let xy = component.get(i);
            this.columnArray[xy[0]].squareArray[xy[1]].evalBomb = evalArray[i];
        }
    }
    private checkEvalLegal(componentNums: MSList): [boolean, boolean] {  //vrati hodnotu [a, b], kde a rika, zda ex. 'nenasycena cisla'; b, ex. 'presycena cisla' (tzn. [0, 0] rika, ze je evalState legalni)
        let a = false, b = false;
        for (let i = 0; i < componentNums.size; i++) {
            let evalBombCount = 0;
            let xy = componentNums.get(i);
            let neighborIndexes = [ [xy[0] - 1, xy[1] - 1], [xy[0], xy[1] - 1], [xy[0] + 1, xy[1] - 1], [xy[0] - 1, xy[1]], [xy[0] + 1, xy[1]], [xy[0] - 1, xy[1] + 1], [xy[0], xy[1] + 1], [xy[0] + 1, xy[1] + 1] ];
            for (let neighbor of neighborIndexes) {
                if (neighbor[0] < 0 || neighbor[0] >= this.columnCount || neighbor[1] < 0 || neighbor[1] >= this.rowCount) continue;
                if (!this.columnArray[neighbor[0]].squareArray[neighbor[1]].triggered
                    && ((this.columnArray[neighbor[0]].squareArray[neighbor[1]].evalBomb && (this.columnArray[neighbor[0]].squareArray[neighbor[1]].state != SquareInfo.State.Safe))
                        || (this.columnArray[neighbor[0]].squareArray[neighbor[1]].state == SquareInfo.State.Certain))) evalBombCount++;
            }
            if (evalBombCount < this.columnArray[xy[0]].squareArray[xy[1]].num) a = true;
            if (evalBombCount > this.columnArray[xy[0]].squareArray[xy[1]].num) b = true;
        }
        return [a, b];
    }
    /**
     * (pouziti pri nastavovani n-te iterace min v kompozitni komponente)
     * @param totals predstavuje pocty legalnich iteraci v jednotlivych komponentach
     * metoda pak vrati, jake iterace subkomponent se musi nastavit, aby celkove slo o tu 'iteration'-tou v poradi
     */
    private getSubiterations(totals: number[], iteration: number): number[] {
        let ret: number[] = [];
        for (let i = 0; i < totals.length; i++) ret.push(0);
        while (iteration > 0) {
            let addition = 1;
            let digit;
            for (digit = 0; totals[digit] * addition <= iteration; digit++) addition *= totals[digit]
            ret[digit] = Math.floor(iteration/addition);
            iteration -= ret[digit] * addition;
        }
        return ret;
    }
    //najdi v arrayi odlisny index od zadaneho
    private getOtherIdx(array: number[], idx: number): number {
        for (let n of array) if (n != idx) return n;
    }

}