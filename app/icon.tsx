import { ImageResponse } from 'next/og';

export const size = {
  width: 192,
  height: 192,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: '#4ade80',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
          color: 'white',
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    },
  );
}
