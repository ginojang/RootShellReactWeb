// src/components/content/WalletProfile.tsx
import { useEffect, useState } from 'react'
import { log } from '../../utils/log';

import { showLoadingSpinner, showYesNoPopup/*, showListViewPopup*/ } from '../ReactUICanvas'
import { copyWalletAddress, getKaiaInfo, openHistory } from '../../content/O2JamPayment'
import { getWalletUserInfo } from '../../content/O2JamWalletUsers'
import { RestartWallet } from '../../content/O2JamMain'

import { getText } from '../../i18n';
import { getLanguage } from '../../config/GlobalEnv' // ✅ 언어 판별용
import { GlobalEnv } from '../../config/GlobalEnv'


interface WalletProfileProps {
    isFirstMode: boolean;
    pictureUrl: string | null;
    displayName: string | null;
    onClose: () => void;
    onShowBlueScreen: () => void;
}

export interface UserInfoResponse {
    success: boolean;
    user: {
        current_used_uuid: string;
        secretKey8: string;
        coins_buyed: number;
        coins_reward: number;
        current_world_key: string;
        current_stage_id: number;
        count_reward_kaia: number;
        is_new_created: boolean;
    };
}

export function WalletProfile({ isFirstMode, pictureUrl, displayName, onClose, onShowBlueScreen }: WalletProfileProps) {
    const [user, setUser] = useState<UserInfoResponse['user'] | null>(null);
    const [kaiaInfo, setKaiaInfo] = useState<{ account: string; balance: number; rate: number } | null>(null);

    // ✅ 언어별 폰트 선택
    const lang = getLanguage();
    const fontFamily = lang === "japanese" ? "MPLUSRounded1cBold" : "MaplestoryBold";

    const titleMarginTop = lang === "japanese" ? '-0.2vh' : '0.4vh';

    useEffect(() => {
        async function fetchUser() {
            const resultStr = await getWalletUserInfo();
            log(`[🧠WalletProfile] getWalletUserInfo result: ${resultStr}`);

            if (!resultStr) {
                if (isFirstMode) onShowBlueScreen?.();
                return;
            }

            try {
                const parsed = JSON.parse(resultStr);
                if (parsed.success && parsed.user) setUser(parsed.user);
            } catch (e) {
                console.error('[WalletProfile] ❌ JSON 파싱 실패', e);
            }

            const kaia = await getKaiaInfo(false);
            if (!kaia) {
                if (isFirstMode) onShowBlueScreen?.();
                return;
            }

            log(`[👛WalletProfile] KAIA Info: ${JSON.stringify(kaia)}`);
            setKaiaInfo(kaia);
            showLoadingSpinner({ loading: false });
        }

        fetchUser();
    }, []);

    async function OnChange() {
        showYesNoPopup(
            getText('t019'),    // Wallet Profile
            getText('t001'),    //`지금 지갑 어드레스를 변경하면,\n 해당 지갑의 데이터로 게임이 변경 됩니다.\n\n 정말 지갑을 변경하시겠습니까?`,
            () => {
                //log('✅ YES 선택됨');
                RestartWallet();
            },
            () => {
                //log('❌ NO 선택됨');
            });
    }

    async function onHistory() {
        openHistory();
        /*
        const content = [
            getText('t021'),
        ]

        showListViewPopup(
            getText('t004'),
            content,
            (content.length === 1) ? 'center' : 'left',
            () => {
            });*/
    }


    if (!user || !kaiaInfo) return null;
    const { is_new_created } = user;
    const { balance: kaiaBalance, account: kaiaAddress } = kaiaInfo;

    if (is_new_created !== isFirstMode) {
        log(`[🧠WalletProfile] Mismatch>>  is_new_created:[${is_new_created}]  vs  isFirstMode:[${isFirstMode}]`);
    }

    const profileImageUrl = pictureUrl ?? '/imgs/ProfileDefault.png';
    const balanceText = `Balance: ${kaiaBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} KAIA`;

    const isReward = false;
    //const isMyNFTs = false;
    const isHistory = true;
    const isExit = true;

    const Button = ({ label, onClick, enabled = true, width = 200, height = 120, textMarginTop = -6, fontSize = 14, bgImageUrl = '/imgs/GreenBtn.png' }: {
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
                    fontFamily: fontFamily, fontSize: `clamp(${fontSize}px, 3vw, ${fontSize}px)`, color: '#fff', marginTop: `${textMarginTop}px`, // 텍스트 기준 살짝 올림
                    textShadow: `0.8px -0.8px 0 #001898, -0.8px -0.8px 0 #001898, -0.8px 0.8px 0 #001898, 0.8px 0.8px 0 #001898`,
                }}>{label}</span>
        </div>
    );

    return (
        <>{
            GlobalEnv.isMobile ? (
                < div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1100 }}>
                    {/*isFirstMode && (<img src="/imgs/ProfileFlagBtn.png" style={{ position: 'absolute', top: '5%', left: '20px', width: '20vw', maxWidth: '180px', height: 'auto', opacity: 0.9, pointerEvents: 'none', filter: 'brightness(0.3)', zIndex: 900 }} />)*/}

                    <div style={{
                        position: 'absolute',
                        top: '5%', // 상단 고정
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90vw',               // 화면 너비의 90% 사용
                        maxWidth: '480px',           // 최대 480px (태블릿, 큰 화면 방지)
                        minWidth: '300px',           // 최소 300px (너무 작아지는 것 방지)
                        aspectRatio: '1000 / 1527',      // 원본 비율 (이미지 비율에 맞게 수정)
                        backgroundImage: 'url("/imgs/OTImgPopupBox.png")',
                        backgroundSize: 'contain',     // 원본 비율 유지
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'top center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: '20px',            // 내부 여백 (px 고정 추천)
                        boxSizing: 'border-box',
                        zIndex: 1100,
                    }}>

                        <div style={{
                            fontSize: 'clamp(20px, 4vw, 20px)', fontFamily: fontFamily, color: '#fff', textAlign: 'center', textShadow: '1.4px -1.4px 0 #46291B, -1.4px -1.4px 0 #46291B, 1.4px 1.4px 0 #46291B, -1.4px 1.4px 0 #46291B',
                            marginTop: titleMarginTop, zIndex: 1,
                        }}>
                            {getText('t019')}
                        </div>

                        <img src={profileImageUrl} alt="Profile" style={{ marginTop: '2vh', width: '30vw', maxWidth: '30vw', height: '30vw', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 12px rgba(0,0,0,0.4)', zIndex: 1101 }} />

                        <div style={{ marginTop: '0vh', fontSize: 'clamp(18px, 3vw, 32px)', fontWeight: 'bold', fontFamily: fontFamily, color: '#642900', textAlign: 'center', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                            {displayName}
                        </div>

                        <div style={{ marginTop: '2.7vh', fontSize: 'clamp(20px, 3.5vw, 38px)', fontWeight: 'bold', fontFamily: 'MaplestoryBold', color: '#642900', textAlign: 'center', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                            {getText('t020')}
                        </div>

                        <div style={{ marginTop: '0.5vh', width: '86%', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 'bold', fontFamily: 'MaplestoryBold', color: '#642900', textAlign: 'center', wordBreak: 'break-word', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                            {kaiaAddress}
                        </div>

                        {/* 복사/변경 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2vw', marginTop: '-5vh' }}>
                            <Button label={getText('t002') /*'Copy'*/} onClick={copyWalletAddress} width={110} />
                            <Button label={getText('t003') /*'Change'*/} onClick={OnChange} width={110} />
                        </div>

                        <div style={{ marginTop: '-2.4vh', fontSize: 'clamp(20px, 3vw, 38px)', fontWeight: 'bold', fontFamily: 'MaplestoryBold', color: '#642900', textAlign: 'center', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                            {balanceText}
                        </div>
                        {/* 리워드 버튼 */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-5vh' }}>
                            <Button label='+ KAIA' onClick={() => { }} enabled={isReward} width={110} />
                        </div>


                        {/* NFT / 히스토리*/}
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1vw', marginTop: '-10vh' }}>
                            {/*<Button label='My NFTs' onClick={() => { }} enabled={isMyNFTs} width={160} textMarginTop={-8} />*/}
                            {<Button label={getText('t004') /*'Purchase History'*/} onClick={onHistory} enabled={isHistory} width={160} textMarginTop={-8.5} />}
                        </div>

                        {/*종료*/}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-4.2vh' }}>
                            <Button label={getText('t005') /*'Return to the Game!'*/} onClick={onClose} enabled={isExit} width={260} height={160} textMarginTop={-9} fontSize={22} bgImageUrl='/imgs/PurpleBtn.png' />
                        </div>
                    </div>
                </div >
            ) :
                (
                    < div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1100 }}>
                        {/*isFirstMode && (<img src="/imgs/ProfileFlagBtn.png" style={{ position: 'absolute', top: '5%', left: '20px', width: '20vw', maxWidth: '180px', height: 'auto', opacity: 0.9, pointerEvents: 'none', filter: 'brightness(0.3)', zIndex: 900 }} />)*/}

                        <div style={{
                            position: 'absolute',
                            top: '5%', // 상단 고정
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '90vw',               // 화면 너비의 90% 사용
                            maxWidth: '480px',           // 최대 480px (태블릿, 큰 화면 방지)
                            minWidth: '300px',           // 최소 300px (너무 작아지는 것 방지)
                            aspectRatio: '1000 / 1527',      // 원본 비율 (이미지 비율에 맞게 수정)
                            backgroundImage: 'url("/imgs/OTImgPopupBox.png")',
                            backgroundSize: 'contain',     // 원본 비율 유지
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'top center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            paddingTop: '20px',            // 내부 여백 (px 고정 추천)
                            boxSizing: 'border-box',
                            zIndex: 1100,
                        }}>

                            <div style={{
                                fontSize: 'clamp(26px, 4vw, 26px)', fontFamily: fontFamily, color: '#fff', textAlign: 'center', textShadow: '1.4px -1.4px 0 #46291B, -1.4px -1.4px 0 #46291B, 1.4px 1.4px 0 #46291B, -1.4px 1.4px 0 #46291B',
                                marginTop: '1.2vh', zIndex: 1,
                            }}>
                                {getText('t019')}
                            </div>

                            <img src={profileImageUrl} alt="Profile" style={{ marginTop: '4vh', width: '10vw', maxWidth: '10vw', height: '10vw', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 12px rgba(0,0,0,0.4)', zIndex: 1101 }} />

                            <div style={{ marginTop: '0vh', fontSize: 'clamp(18px, 3vw, 32px)', fontWeight: 'bold', fontFamily: fontFamily, color: '#642900', textAlign: 'center', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                                {displayName}
                            </div>

                            <div style={{ marginTop: '2.7vh', fontSize: 'clamp(20px, 3.5vw, 20px)', fontWeight: 'bold', fontFamily: 'MaplestoryBold', color: '#642900', textAlign: 'center', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                                {getText('t020')}
                            </div>

                            <div style={{ marginTop: '0.5vh', width: '86%', fontSize: 'clamp(13px, 2.5vw, 13px)', fontWeight: 'bold', fontFamily: 'MaplestoryBold', color: '#642900', textAlign: 'center', wordBreak: 'break-word', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                                {kaiaAddress}
                            </div>

                            {/* 복사/변경 버튼 */}
                            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2vw', marginTop: '-4vh' }}>
                                <Button label={getText('t002') /*'Copy'*/} onClick={copyWalletAddress} width={110} />
                                <Button label={getText('t003') /*'Change'*/} onClick={OnChange} width={110} />
                            </div>

                            <div style={{ marginTop: '-2.4vh', fontSize: 'clamp(20px, 3vw, 20px)', fontWeight: 'bold', fontFamily: 'MaplestoryBold', color: '#642900', textAlign: 'center', textShadow: '1px 1px 0 #ffffffaa, -1px -1px 0 #ffffffaa' }}>
                                {balanceText}
                            </div>
                            {/* 리워드 버튼 */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-4vh' }}>
                                <Button label='+ KAIA' onClick={() => { }} enabled={isReward} width={110} />
                            </div>


                            {/* NFT / 히스토리*/}
                            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1vw', marginTop: '-6vh' }}>
                                {/*<Button label='My NFTs' onClick={() => { }} enabled={isMyNFTs} width={160} textMarginTop={-8} />*/}
                                {<Button label={getText('t004') /*'Purchase History'*/} onClick={onHistory} enabled={isHistory} width={160} textMarginTop={-8.5} />}
                            </div>

                            {/*종료*/}
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-2.8vh' }}>
                                <Button label={getText('t005') /*'Return to the Game!'*/} onClick={onClose} enabled={isExit} width={260} height={160} textMarginTop={-9} fontSize={22} bgImageUrl='/imgs/PurpleBtn.png' />
                            </div>
                        </div>
                    </div >
                )
        }</>
    );
}