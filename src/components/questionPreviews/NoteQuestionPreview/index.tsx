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
}

function NoteQuestionPreview(props: Props) {
    const {
        className,
        label,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'This is a note. This field cannot return any response.'}
                spacing="none"
                block
            />
            <TextInput
                name={undefined}
                placeholder="Enter note"
                value={undefined}
                icons={<MdOutlineAbc />}
                readOnly
            />
        </div>
    );
}

export default NoteQuestionPreview;
