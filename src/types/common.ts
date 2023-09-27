export interface ChoiceType {
    id: string;
    name: string;
    label: string;
    collectionId: string;
}

export interface ChoiceCollectionType {
    id: string;
    name: string;
    label: string;
    choices: ChoiceType[];
}
