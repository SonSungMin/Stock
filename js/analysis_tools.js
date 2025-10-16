// js/analysis_tools.js

/**
 * Hodrick-Prescott 필터를 적용하여 시계열 데이터의 추세(trend)를 추출합니다.
 * @param {number[]} series - 원본 시계열 데이터 배열.
 * @param {number} lambda - 스무딩 매개변수 (분기 데이터는 보통 1600).
 * @returns {number[]} - 계산된 추세(trend) 데이터 배열.
 */
export function hpfilter(series, lambda) {
    const T = series.length;
    if (T < 4) {
        return series; // 필터를 적용하기에 데이터가 너무 적음
    }

    // HP 필터 계산을 위한 3중 대각 행렬(tridiagonal matrix) 생성
    const I = new Array(T).fill(0).map(() => new Array(T).fill(0));
    for (let i = 0; i < T; i++) I[i][i] = 1;

    const D = new Array(T - 2).fill(0).map(() => new Array(T).fill(0));
    for (let i = 0; i < T - 2; i++) {
        D[i][i] = 1;
        D[i][i + 1] = -2;
        D[i][i + 2] = 1;
    }

    const D_T = new Array(T).fill(0).map(() => new Array(T - 2).fill(0));
    for (let i = 0; i < T; i++) {
        for (let j = 0; j < T - 2; j++) {
            D_T[i][j] = D[j][i];
        }
    }

    const K = new Array(T - 2).fill(0).map(() => new Array(T).fill(0));
     for (let i = 0; i < T - 2; i++) {
        for (let j = 0; j < T; j++) {
            K[i][j] = D[i][j];
        }
    }

    const K_T = new Array(T).fill(0).map(() => new Array(T - 2).fill(0));
    for (let i = 0; i < T; i++) {
        for (let j = 0; j < T - 2; j++) {
            K_T[i][j] = K[j][i];
        }
    }

    const M = multiply(K_T, K);
    const A = add(I, multiplyScalar(M, lambda));

    // 역행렬 계산 (가우스-조던 소거법)
    const invA = invert(A);
    if (!invA) {
        console.error("HP Filter: Matrix inversion failed.");
        return series;
    }

    // 추세 = (I + λK'K)^-1 * y
    const trend = multiplyVector(invA, series);

    return trend;
}

// --- 행렬 연산을 위한 헬퍼 함수들 ---

function multiply(A, B) {
    const C = new Array(A.length).fill(0).map(() => new Array(B[0].length).fill(0));
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < B[0].length; j++) {
            for (let k = 0; k < A[0].length; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return C;
}

function multiplyScalar(A, s) {
    return A.map(row => row.map(val => val * s));
}

function add(A, B) {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

function multiplyVector(A, v) {
    const result = new Array(A.length).fill(0);
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < v.length; j++) {
            result[i] += A[i][j] * v[j];
        }
    }
    return result;
}

function invert(A) {
    const n = A.length;
    const I = new Array(n).fill(0).map((_, i) => {
        const row = new Array(n).fill(0);
        row[i] = 1;
        return row;
    });

    const C = A.map((row, i) => [...row, ...I[i]]);

    for (let i = 0; i < n; i++) {
        let pivot = i;
        while (pivot < n && C[pivot][i] === 0) pivot++;
        if (pivot === n) return null; // 역행렬 없음

        [C[i], C[pivot]] = [C[pivot], C[i]];

        const div = C[i][i];
        for (let j = i; j < 2 * n; j++) {
            C[i][j] /= div;
        }

        for (let k = 0; k < n; k++) {
            if (i !== k) {
                const mult = C[k][i];
                for (let j = i; j < 2 * n; j++) {
                    C[k][j] -= mult * C[i][j];
                }
            }
        }
    }

    return C.map(row => row.slice(n));
}
