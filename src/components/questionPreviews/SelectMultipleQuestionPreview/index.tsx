import { useCallback } from 'react';
import {
    MdOutlineChecklist,
} from 'react-icons/md';
import {
    _cs,
    noOp,
} from '@togglecorp/fujs';
import {
    Checkbox,
    Element,
    ListView,
    TextOutput,
} from '@the-deep/deep-ui';

import {
    ChoiceCollectionType,
    ChoiceType,
} from '#types/common';

import styles from './index.module.css';

const choiceKeySelector = (d: ChoiceType) => d.id;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollection: ChoiceCollectionType | undefined;
}

function SelectMultipleQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
        choiceCollection,
    } = props;

    const checkboxRendererParams = useCallback((_: string, datum: ChoiceType) => ({
        label: datum?.label,
        name: 'choiceCollection',
        value: false,
        readOnly: true,
        onChange: noOp,
    }), []);

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
                icons={<MdOutlineChecklist />}
                iconsContainerClassName={styles.icon}
            >
                <ListView
                    className={styles.choices}
                    data={choiceCollection?.choices}
                    keySelector={choiceKeySelector}
                    renderer={Checkbox}
                    rendererParams={checkboxRendererParams}
                    filtered={false}
                    errored={false}
                    pending={false}
                />
            </Element>
        </div>
    );
}

export default SelectMultipleQuestionPreview;
