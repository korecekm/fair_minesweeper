import { EvaluationData } from "./evaluation_data";
import { MSList } from "./ms_list";
import { EvaluationDataSimple } from "./evaluation_data-simple";

export class EvaluationDataComposite implements EvaluationData {
    public minMines: number; public maxMines: number;

    public bridgeList: MSList;
    public subcomponentBridges: Array<Array<number>>; //indexy v bridgeListu
    public subcomponentNums: MSList[];
    public subcomponentIdles: MSList[];
    //kazda subkomponenta bude mit array svych evaluation dat indexovanych cisly, ktere by byly reprezentovany boolovskym arrayem pritomnosti bomb v 'mostech', kdyby to byl integer v Lsb-first
    //(tzn. pokud ma treba komponenta 3 prilehle mosty, vysledek pro [bomba,bomba,volne] bude v indexu 2 (jde o cislo 011 ve dvojkove soustave))
    public subcomponentEvaluation: Array<Array<EvaluationData>>;
    
    public formCountArray(countArray: number[], lowerLimit: number, upperLimit: number): number {
        let length = this.bridgeList.size;
        this.bridgeValueArray = [];
        for (let i = 0; i < length; i++) this.bridgeValueArray.push(false);
        for (let i = 0; i < this.subcomponentIdles.length; i++) length += this.subcomponentIdles[i].size;
        for (let i = 0; i < length; i++) countArray.push(0);
        let total = 0;

        let cont = true;
        outer: while (cont) {   //iterace vsemi moznymi rozestavenimi 'mostovych' idles
            let bridgeBombCount = this.getBridgeBombCount();
            //ziskej data k subkomponentam:
            let subdata: EvaluationData[] = [];
            for (let i = 0; i < this.subcomponentEvaluation.length; i++) {  //iterace subkomponentami
                let current: EvaluationDataSimple = this.subcomponentEvaluation[i][this.getSubcomponentIteration(this.bridgeValueArray, i)] as EvaluationDataSimple;
                if (current.totalArray === undefined || current.totalArray.length == 0) {   //subkomponenta nema v tomto rozestaveni legalni moznost, tzn. nema smysl toto rozestaveni zkouset
                    cont = this.incrementValueArray();
                    continue outer;
                }
                subdata.push(current);
            }
            
            //sloz data dohromady:
            let minPrefixes = []; minPrefixes.push(subdata[0].minMines);
            let maxPrefixes = []; maxPrefixes.push(subdata[0].maxMines);
            for (let i = 1; i < subdata.length; i++) {
                minPrefixes.push(minPrefixes[i-1] + subdata[i].minMines);
                maxPrefixes.push(maxPrefixes[i-1] + subdata[i].maxMines);
            }
            //(vznikla omezeni stale nemusi vyhovovat..)
            let totals: Array<number> = [];
            let subarrays: Array<Array<number>> = [];
            let subtotal = 1;
            for (let i = 0; i < subdata.length; i++) {
                subarrays.push([]);
                let currentSub: number[] = [];
                let low = lowerLimit - bridgeBombCount - ((i==0) ? 0 : maxPrefixes[i-1]) - ((i==maxPrefixes.length-1) ? 0 : maxPrefixes[maxPrefixes.length-1] - maxPrefixes[i]);
                let up = upperLimit - bridgeBombCount - ((i==0) ? 0 : minPrefixes[i-1]) - ((i==minPrefixes.length-1) ? 0 : minPrefixes[minPrefixes.length-1] - minPrefixes[i]);
                let currTotal = subdata[i].formCountArray(currentSub, low, up);
                
                if (currTotal == 0) {
                    cont = this.incrementValueArray();
                    subarrays.splice(subarrays.length-1, 1);
                    continue outer;
                }
                subarrays[subarrays.length-1] = subarrays[subarrays.length-1].concat(currentSub);
                totals.push(currTotal);
                subtotal *= currTotal;
            }
            
            //konecne samotne doplneni count arraye:
            let idx = 0;
            for (let i = 0; i < this.bridgeValueArray.length; i++) {
                if (this.bridgeValueArray[i]) countArray[idx] += subtotal;
                idx++;
            }
            for (let i = 0; i < subarrays.length; i++) {
                let multiply = subtotal / totals[i];
                for (let j = 0; j < subarrays[i].length; j++) {
                    countArray[idx] += subarrays[i][j] * multiply;
                    idx++;
                }
            }
            total += subtotal;
            cont = this.incrementValueArray();
        }

        return total;
    }

    //util: (pro formCountArray)
    private bridgeValueArray: boolean[];
    private incrementValueArray(): boolean {  //vrati false, pokud jsme dosli na konec
        let i;
        for (i = 0; this.bridgeValueArray.length > i && this.bridgeValueArray[i]; i++) this.bridgeValueArray[i] = false;
        if (i == this.bridgeValueArray.length) return false;
        this.bridgeValueArray[i] = true;
        return true;
    }
    public getSubcomponentIteration(bridgeArray: boolean[], subcompIdx: number): number {  //pro subkomponentu na danem indexu vrati, na kterem indexu (v subcomponentEvaluation) ma prislusnou hodnotu pro soucasny bridgeValueArray
        let iteration = 0;
        let inc = 1;
        for (let i = 0; i < this.subcomponentBridges[subcompIdx].length; i++) {
            if (bridgeArray[this.subcomponentBridges[subcompIdx][i]]) iteration += inc;
            inc *= 2;
        }
        return iteration;
    }

    public autoSetMinMax() {
        let min = 999999;  //'nekonecno'
        let max = 0;

        this.bridgeValueArray = [];
        for (let i = 0; i < this.bridgeList.size; i++) this.bridgeValueArray.push(false);
        let cont = true;
        outer: while (cont) {
            let subdata: EvaluationData[] = [];
            for (let i = 0; i < this.subcomponentEvaluation.length; i++) {  //iterace subkomponentami
                let current: EvaluationDataSimple = this.subcomponentEvaluation[i][this.getSubcomponentIteration(this.bridgeValueArray, i)] as EvaluationDataSimple;
                if (current.totalArray === undefined || current.totalArray.length == 0) {   //subkomponenta nema v tomto rozestaveni legalni moznost, tzn. nema smysl toto rozestaveni zkouset
                    cont = this.incrementValueArray();
                    continue outer;
                }
                subdata.push(current);
            }
            let currMin = this.getBridgeBombCount();
            let currMax = this.getBridgeBombCount();
            for (let i = 0; i < subdata.length; i++) {
                currMin += subdata[i].minMines;
                currMax += subdata[i].maxMines;
            }

            if (min > currMin) min = currMin;
            if (max < currMax) max = currMax;
            cont = this.incrementValueArray();
        }

        this.minMines = min;
        this.maxMines = max;
    }
    private getBridgeBombCount() {
        let count = 0;
        for (let i = 0; i < this.bridgeValueArray.length; i++) if (this.bridgeValueArray[i]) count++;
        return count;
    }
}