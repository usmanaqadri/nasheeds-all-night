import React from "react";

const FormattedLine = ({ text = "", formatting = [] }) => {
    const ranges = [...formatting]
        .filter(
            ({ start, end }) =>
                Number.isInteger(start) &&
                Number.isInteger(end) &&
                start >= 0 &&
                end <= text.length &&
                start < end
        )
        .sort((a, b) => a.start - b.start);

    const elements = [];
    let cursor = 0;

    ranges.forEach(({ start, end, styles }, index) => {
        // This initial implementation assumes non-overlapping ranges.
        if (start < cursor) return;

        if (start > cursor) {
            elements.push(text.slice(cursor, start));
        }

        elements.push(
            <span
                key={index}
                style={{
                    fontWeight: styles?.bold ? 700 : undefined,
                    fontStyle: styles?.italic ? "italic" : undefined,
                    textDecoration: styles?.underline ? "underline" : undefined,
                    fontSize: styles?.fontSize
                        ? `${styles.fontSize}em`
                        : undefined,
                }}
            >
                {text.slice(start, end)}
            </span>
        );

        cursor = end;
    });

    elements.push(text.slice(cursor));

    return <>{elements}</>;
};

export default FormattedLine;