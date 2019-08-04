import { EvaluationData } from "./evaluation_data";

export class EvaluationDataSimple implements EvaluationData {
    public minMines: number; public maxMines: number;

    //kazdy index v techto trech arrayich predstavuje slozku evaluationu komponenty..
    //bombCountArray rika, kolik bomb je na tomto indexu zkouseno
    //totalArray rika, kolik celkem moznosti existuje
    //possibility array daneho indexu pak obsahuje pro kazde policko komponenty, kolikrat se na nem v legalnich iteracich vyskytla mina
    public bombCountArray: Array<number>;
    public totalArray: Array<number>;
    public possibilityArrays: Array<Array<number>>;

    constructor(min, max) {
        this.minMines = min;
        this.maxMines = max;
        this.bombCountArray = [];
        this.totalArray = [];
        this.possibilityArrays = [];
    }

    public formCountArray(countArray: number[], lowerLimit: number, upperLimit: number): number {
        let length = this.possibilityArrays[0].length;
        for (let i = 0; i < length; i++) countArray.push(0);

        let total: number = 0;
        for (let j = 0; j < this.possibilityArrays.length; j++) {
            if (this.bombCountArray[j] > upperLimit || this.bombCountArray[j] < lowerLimit) continue;
            total += this.totalArray[j];
            for (let i = 0; i < length; i++) {
                countArray[i] += this.possibilityArrays[j][i];
            }
        }
        return total;
    }
}