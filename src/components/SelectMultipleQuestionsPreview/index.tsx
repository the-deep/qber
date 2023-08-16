import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    MultiSelectInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function SelectMultipleQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label?? 'Which Country needs the assistance quickest?'}
                description={hint ?? 'Choose One'}
                spacing="none"
                block
            />
            <MultiSelectInput
                keySelector={function noRefCheck() { }}
                label="Country"
                labelSelector={function noRefCheck() { }}
                name="test"
                onChange={function noRefCheck() { }}
                options={[]}
            />
        </div>
    );
}

export default SelectMultipleQuestionPreview;
