// src/components/popups/ListViewPopup.tsx
import { getText } from '../../i18n';

type ListViewPopupPopupProps = {
    title: string;
    content: string[]; // ✅ string → string[] (리스트형)
    align?: 'left' | 'center' | 'right' | 'justify';
    onOkay: () => void;
};

export function ListViewPopup({ title, content, align, onOkay }: ListViewPopupPopupProps) {
    const textAlign = align || 'center';

    const Button = ({
        label, onClick, enabled = true, width = 200, height = 120, textMarginTop = -6, fontSize = 14
    }: {
        label: string;
        onClick: () => void;
        enabled?: boolean;
        width?: number;
        height?: number;
        textMarginTop?: number;
        fontSize?: number;
    }) => (
        <div
            onClick={() => enabled && onClick()}
            style={{
                width: `${width}px`, height: `${height}px`,
                backgroundImage: 'url("/imgs/GreenBtn.png")',
                backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: enabled ? 'pointer' : 'not-allowed',
                pointerEvents: enabled ? 'auto' : 'none',
                filter: enabled ? 'none' : 'grayscale(100%) brightness(80%)',
                opacity: enabled ? 1 : 0.5,
                zIndex: 1101,
                margin: '1vh 2vw',
            }}>
            <span
                style={{
                    fontFamily: "'Pretendard Variable', Pretendard, sans-serif", fontSize: `clamp(${fontSize}px, 3vw, ${fontSize}px)`, color: '#fff', marginTop: `${textMarginTop}px`,
                    textShadow: `0.8px -0.8px 0 #001898, -0.8px -0.8px 0 #001898, -0.8px 0.8px 0 #001898, 0.8px 0.8px 0 #001898`,
                }}>{label}</span>
        </div>
    );

    return (
        <div style={{
            backgroundColor: 'rgb(255, 225, 185)',
            borderRadius: '16px',
            padding: '24px',
            width: '320px',
            minHeight: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            border: '3px solid #46291B',
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`,
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute', top: '0', left: '0', width: '100%', height: '60px',
                backgroundColor: '#46291B', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', zIndex: 0,
            }} />
            <div style={{
                position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                fontSize: '24px', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", color: '#fff', textAlign: 'center', padding: '0 8px',
                textShadow: '1.4px -1.4px 0 #46291B, -1.4px -1.4px 0 #46291B, 1.4px 1.4px 0 #46291B, -1.4px 1.4px 0 #46291B',
                zIndex: 1, lineHeight: '1',
            }}>{title}</div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                    flexGrow: 1,
                    marginTop: '60px',
                    overflowY: 'auto', // ✅ 스크롤
                    WebkitOverflowScrolling: 'touch', // ✅ 터치 스크롤
                    maxHeight: '300px',
                    padding: '8px 4px',
                }}>
                    <ul style={{
                        padding: 0,
                        margin: 0,
                        listStyle: 'none',
                        fontSize: '16px',
                        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
                        lineHeight: '1.4',
                        textAlign,
                    }}>
                        {content.map((line, index) => (
                            <li key={index} style={{ marginBottom: '6px' }}>{line}</li>
                        ))}
                    </ul>
                </div>

                <div style={{
                    marginTop: '10px', display: 'flex', justifyContent: 'center',
                    flexWrap: 'wrap', gap: '2vw', paddingTop: '16px', height: '64px', padding: 0,
                }}>
                    <Button label={getText('t011')} onClick={onOkay} width={130} height={64} />
                </div>
            </div>
        </div>
    );
}
