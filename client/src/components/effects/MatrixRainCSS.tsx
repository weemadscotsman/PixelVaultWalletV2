import React from 'react';

// Matrix characters from the film
const MATRIX_CHARS = `日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍｦｲｸｺｿﾁﾄﾉﾌﾔﾖﾙﾚﾛﾝ九七二十四午三八六五
円下北千百万子東南西北今明後前上下田円町村花見山川市入出本天空雨夜明月星火水木金土
曜日年中半時分秒週春夏秋冬男女人家語文字右左解計`;

/**
 * A pure CSS implementation of the Matrix rain effect
 * This is more reliable than canvas-based implementations
 */
export function MatrixRainCSS() {
  // Create 15 columns of matrix characters - each with different positions and speeds
  return (
    <div className="matrix-background">
      {/* Create multiple columns with different positions */}
      {Array.from({ length: 15 }).map((_, colIndex) => (
        <div 
          key={colIndex}
          className="matrix-column"
          style={{
            left: `${(colIndex * 7)}%`,
            width: '7%',
            animationDelay: `${colIndex * 0.3}s`,
            fontSize: `${Math.max(14, Math.min(24, 16 + Math.floor(Math.random() * 8)))}px`,
          }}
        >
          {MATRIX_CHARS}
        </div>
      ))}
    </div>
  );
}