import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
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

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Which Country needs the assistance quickest?'}
                description={hint ?? 'Choose One'}
                spacing="none"
                block
            />
        </div>
    );
}

export default SelectOneQuestionPreview;
