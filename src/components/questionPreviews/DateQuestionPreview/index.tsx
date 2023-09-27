import {
    MdOutlineCalendarMonth,
} from 'react-icons/md';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextOutput,
    DateInput,
    Element,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
}

function DateQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
    } = props;

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                label={label ?? 'Enter Question Label'}
                description={hint ?? 'Enter hint'}
                spacing="none"
                hideLabelColon
                block
            />
            <Element
                icons={<MdOutlineCalendarMonth />}
                iconsContainerClassName={styles.icon}
                childrenContainerClassName={styles.uploadPreview}
            >
                <DateInput
                    name={undefined}
                    placeholder="Select Date"
                    value={undefined}
                    readOnly
                />
            </Element>
        </div>
    );
}

export default DateQuestionPreview;
