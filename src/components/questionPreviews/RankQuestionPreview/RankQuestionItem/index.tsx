import {
    GrDrag,
} from 'react-icons/gr';
import {
    Element,
} from '@the-deep/deep-ui';

import styles from './index.module.css';

interface Props {
    title: string;
}

function RankQuestionItem(props: Props) {
    const {
        title,
    } = props;

    return (
        <Element
            className={styles.itemWrapper}
            icons={<GrDrag />}
            iconsContainerClassName={styles.icon}
            childrenContainerClassName={styles.item}
        >
            {title}
        </Element>
    );
}

export default RankQuestionItem;
