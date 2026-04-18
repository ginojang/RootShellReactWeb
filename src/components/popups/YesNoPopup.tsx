// src/components/popups/YesNoPopup.tsx
import { getText } from '../../i18n';
import { getLanguage } from '../../config/GlobalEnv'
//import { GlobalEnv } from '../../config/GlobalEnv'

type YesNoPopupProps = {
    title: string;
    content: string;
    onYes: () => void;
    onNo: () => void;
};

export function YesNoPopup({ title, content, onYes, onNo }: YesNoPopupProps) {
    const Button = ({
        label, onClick, enabled = true, width = 200, height = 120, textMarginTop = -6, fontSize = 14, bgImageUrl = '/imgs/GreenBtn.png',
    }: {
        label: string;
        onClick: () => void;
        enabled?: boolean;
        width?: number;
        height?: number;
        textMarginTop?: number;
        fontSize?: number;
        bgImageUrl?: string;
    }) => (
        <div
            onClick={() => enabled && onClick()}
            style={{
                width: `${width}px`, height: `${height}px`,
                backgroundImage: `url("${bgImageUrl}")`,
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
                    fontFamily: fontFamily, fontSize: `clamp(${fontSize}px, 3vw, ${fontSize}px)`, color: '#fff', marginTop: `${textMarginTop}px`,
                    textShadow: `0.8px -0.8px 0 #001898, -0.8px -0.8px 0 #001898, -0.8px 0.8px 0 #001898, 0.8px 0.8px 0 #001898`,
                }}>{label}</span>
        </div>
    );

    // ✅ 언어별 폰트 선택
    const lang = getLanguage();
    const fontFamily = lang === "japanese" ? "MPLUSRounded1cBold" : "MaplestoryBold";

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
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: fontFamily,
                color: '#fff',
                textAlign: 'center',
                padding: '0 8px',
                textShadow: '1.4px -1.4px 0 #46291B, -1.4px -1.4px 0 #46291B, 1.4px 1.4px 0 #46291B, -1.4px 1.4px 0 #46291B',
                zIndex: 1,
                lineHeight: '1',
                width: '95%',                      // ✅ 폭 제한
                fontSize: 'clamp(20px, 2vw, 20px)',// ✅ 폰트 자동 축소
                whiteSpace: 'nowrap',              // ✅ 줄바꿈 방지
                overflow: 'hidden',                // ✅ 넘치는 텍스트 숨김
                textOverflow: 'ellipsis',          // ✅ 말줄임 처리
            }}>
                {title}
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{
                    flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    textAlign: 'center', whiteSpace: 'pre-line', marginTop: '60px',
                }}>
                    <p style={{
                        margin: 0,
                        lineHeight: '1.2',        // ✅ 줄 간격 (기본은 1.2~1.4 정도, 좀 더 띄움)
                        // letterSpacing: '0.05em',  // ✅ 글자 간 간격 (선택사항)
                    }}>{content}</p>
                </div>

                <div style={{
                    marginTop: '10px', display: 'flex', justifyContent: 'center',
                    flexWrap: 'nowrap', // ✅ 줄 바꿈 금지
                    //flexWrap: 'wrap', 
                    gap: '2vw', paddingTop: '16px', height: '64px', padding: 0,
                }}>
                    <Button label={getText('t009')} onClick={onYes} width={130} height={64} />
                    <Button label={getText('t010')} onClick={onNo} width={130} height={64} bgImageUrl="/imgs/PurpleBtn.png" />
                </div>
            </div>
        </div>
    );
}
