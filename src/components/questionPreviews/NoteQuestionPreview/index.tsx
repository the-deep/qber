import {
    MdOutlineEditNote,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    Element,
    TextOutput,
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
            <Element
                icons={<MdOutlineEditNote />}
                iconsContainerClassName={styles.icon}
                childrenContainerClassName={styles.uploadPreview}
            >
                <TextOutput
                    value={label ?? 'This is a note. This field cannot return any response.'}
                    spacing="none"
                    block
                />
            </Element>
        </div>
    );
}

export default NoteQuestionPreview;
