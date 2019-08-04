export abstract class EvaluationData {
    public minMines: number;
    public maxMines: number;

    /**
     * z dat v sobe jiz ulozenych slozi mozne pocty min v polich komponenty (tak, jak jsou indexovane v minesweeper service)
     * - vlozi je do ziskaneho countArray (ta by mela byt vlozena jako prazdne pole) a vrati 'total', tzn. celkovy pocet moznosti (aby bylo mozne urcit finalni pravdepodobnosti)
     * pritom budou celkove pocty min v komponente v rozsahu od lowerLimit do upperLimit (vcetne)
     * 
     * POZOR!
     * u composite komponent je treba komponent listy v minesweeper service preindexovat, aby policka sla v poradi: bridges, nulta subkomponenta, prvni, ..., n-tá
     * (v tomto poradi se bude vracet countArray)
     */
    public abstract formCountArray(countArray: number[], lowerLimit: number, upperLimit: number): number;
}