import { SquareInfo } from "./square_info";


export class ColumnInfo {
    public index: number;
    public squareArray: SquareInfo[];

    constructor(idx: number, squareCount: number) {
        this.index = idx;
        this.squareArray = [];
        for (let i = 0; i < squareCount; i++) {
            this.squareArray.push(new SquareInfo(idx, i));
        }
    }
}