import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    RadioInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function SelectOneQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    const keySelector = (d) => d.id;
    const labelSelector = (d) => d.name;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Which Country needs the assistance quickest?'}
                description={hint ?? 'Choose One'}
                spacing="none"
                block
            />
            <RadioInput
                keySelector={keySelector}
                label="Country"
                labelSelector={labelSelector}
                name="test"
                onChange={function noRefCheck() { }}
                options={[]}
                value={[]}
            />
        </div>
    );
}

export default SelectOneQuestionPreview;
