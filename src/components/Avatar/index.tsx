import React, { useState, useEffect } from 'react';
import { IoPersonOutline } from 'react-icons/io5';
import {
    _cs,
    isDefined,
    getHexFromString,
    getColorOnBgColor,
} from '@togglecorp/fujs';

import styles from './index.module.css';

function getInitials(name?: string) {
    if (!name || name.trim().length <= 0) {
        return (
            <IoPersonOutline className={styles.defaultUser} />
        );
    }
    const letters = name.trim().split(/\s/).map((item) => item[0]);
    return (
        letters.length <= 1
            ? letters[0]
            : `${letters[0]}${letters[letters.length - 1]}`
    );
}

function useImage(src?: string) {
    const hasImage = isDefined(src);

    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setHasError(false);

        const handleLoad = () => {
            setLoading(false);
            setHasError(false);
        };

        const handleError = () => {
            setLoading(false);
            setHasError(true);
        };

        const image = new Image();
        image.addEventListener('error', handleError);
        image.addEventListener('load', handleLoad);

        if (src) {
            image.src = src;
        }

        return () => {
            image.removeEventListener('error', handleError);
            image.removeEventListener('load', handleLoad);
        };
    }, [src]);

    return { isLoading: loading, hasError, hasImage };
}

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
    name?: string;
}

function Avatar(props: AvatarProps) {
    const {
        className: classNameFromProps,
        name,
        src,
        ...otherProps
    } = props;

    const { isLoading, hasError, hasImage } = useImage(src);

    const className = _cs(classNameFromProps, styles.avatar);

    if (!hasImage || hasError || isLoading) {
        const initials = getInitials(name);
        const backgroundColor = name && name.trim().length > 0
            ? getHexFromString(name) : '#fff';
        const textColor = getColorOnBgColor(backgroundColor);

        return (
            <div className={className}>
                <div
                    className={styles.icon}
                    style={{
                        backgroundColor,
                        color: textColor,
                    }}
                >
                    {initials}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <img
                className={styles.image}
                alt={name}
                src={src}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
            />
        </div>
    );
}
export default Avatar;
