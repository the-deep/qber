import {
    MdOutline123,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    NumberInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function IntegerQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Enter Question Label'}
                description={hint ?? 'Enter hint'}
                spacing="none"
                block
            />
            <NumberInput
                name={undefined}
                placeholder="Enter integer"
                value={undefined}
                icons={<MdOutline123 />}
                readOnly
            />
        </div>
    );
}

export default IntegerQuestionPreview;
