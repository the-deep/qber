import {
    IoRadioButtonOn,
} from 'react-icons/io5';
import {
    _cs,
    noOp,
} from '@togglecorp/fujs';
import {
    Element,
    RadioInput,
    TextOutput,
} from '@the-deep/deep-ui';

import {
    ChoiceCollectionType,
    ChoiceType,
} from '#types/common';

import styles from './index.module.css';

const choiceCollectionKeySelector = (d: ChoiceType) => d.id;
const choiceCollectionLabelSelector = (d: ChoiceType) => d.label;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollection: ChoiceCollectionType;
}

function SelectOneQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
        choiceCollection,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                label={label ?? 'Title'}
                description={hint ?? 'Choose One'}
                spacing="none"
                hideLabelColon
                block
            />
            <Element
                className={styles.choicesPreview}
                icons={<IoRadioButtonOn />}
                iconsContainerClassName={styles.icon}
            >
                <RadioInput
                    listContainerClassName={styles.choices}
                    keySelector={choiceCollectionKeySelector}
                    labelSelector={choiceCollectionLabelSelector}
                    name="options"
                    onChange={noOp}
                    options={choiceCollection?.choices}
                    value={choiceCollection?.name}
                    readOnly
                />
            </Element>
        </div>
    );
}

export default SelectOneQuestionPreview;
