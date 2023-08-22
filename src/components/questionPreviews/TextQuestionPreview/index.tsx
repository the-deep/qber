import {
    MdOutlineAbc,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    TextInput,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function TextQuestionPreview(props: Props) {
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
            <TextInput
                name={undefined}
                placeholder="Enter text"
                value={undefined}
                icons={<MdOutlineAbc />}
                readOnly
            />
        </div>
    );
}

export default TextQuestionPreview;
