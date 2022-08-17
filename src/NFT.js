import { useEffect, useMemo, useState } from 'react';

import { LazyLoadComponent } from 'react-lazy-load-image-component';

import "./NFT.css";

const NFT = ({ nft, handleBlock }) => {
    const isActive = nft?.activeOffer || nft?.activeBuyNow

    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const [endsIn, setEndsIn] = useState(0);

    const [video, setVideo] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);

    const assetPath = useMemo(() => {
        const path = `${nft.assetScheme}${nft.assetHost}${nft.assetPath}`

        // check if asset path ends in .png or .jpg or .gif
        if (!nft.assetPath.endsWith('.png') && !nft.assetPath.endsWith('.jpg') && !nft.assetPath.endsWith('.gif')) {
            setVideo(true);

            if (nft.assetIPFSPath) {
                return `https://ipfs.io/ipfs/${nft.assetIPFSPath}`
            }
        }


        return path;
    }, [nft])

    useEffect(() => {
        if (!nft?.auction) return

        const ends_in = nft.auction.endsAt - Date.now() / 1000;

        const _timeElapsed = setTimeout(() => {
            setTimeElapsed(timeElapsed + 1)

            setEndsIn(new Date((ends_in - timeElapsed) * 1000).toISOString().substring(11, 19))
        }, 1000)

        return () => {
            clearTimeout(_timeElapsed)
        }
    }, [timeElapsed, nft?.auction])

    return (
        <a href={`https://foundation.app/@${nft.creator.username}/${nft.collection.slug}/${nft.tokenId}?ref=0xa7C8B34bca69a047c5EB4438e90b3F4AB9E8450F`} target="_blank" rel="noreferrer">
            <div className="nft">
                <div className="nft-image">
                    <LazyLoadComponent id={nft.id}>
                        {!video ? <div className="nft-image" style={{
                            backgroundImage: `url(${assetPath})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            width: '100%',
                            minHeight: 300,
                        }} /> :
                            <video 
                                src={assetPath.includes('mp4') ? assetPath : `${assetPath}/nft.mp4` } 
                                poster={assetPath.includes('.jpg') ? assetPath : `${assetPath}/nft.jpg`} 
                                muted loop={true} autoPlay={true} playsInline={true} style={{
                                width: "100%",
                                height: "100%",
                            }}></video>
                        }
                    </LazyLoadComponent>
                </div>

                <div className="info">
                    <div className="creator">
                        <div onClick={() => { openInNewTab(`https://foundation.app/@${nft.creator.username}`) }}>
                            <img alt={`${nft.tokenId}`} src={nft.creator.profileImageUrl} style={{
                                width: 25,
                                height: 25,
                                borderRadius: '50%',
                                marginRight: 10,
                                verticalAlign: 'middle',
                            }} />

                            {nft.creator.username}
                        </div>

                        {/* <div onClick={() => { openInNewTab(`https://foundation.app/@${nft.creator.username}`) }} style={{
                            textAlign: "right",
                            display: "flex",
                            fontSize: "12px",

                        }}>
                            Hide Artist
                        </div> */}
                    </div>

                    {!isActive && nft.auction && <div className="auction">
                        <div>
                            <p><span>Current bid</span></p>
                            <p>{nft.auction.currentPrice} ETH</p>
                        </div>
                        <div>
                            <p><span>Ends in</span></p>
                            <p>{endsIn}</p>
                        </div>
                    </div>}

                    {nft.activeBuyNow && <div className="buy-now">
                        <div>
                            <p><span>Buy now</span></p>
                            <p>{nft.activeBuyNow.amountInETH} ETH</p>
                        </div>
                        {nft.activeOffer && <div>
                            <p><span>Active offer</span></p>
                            <p>{nft.activeOffer.amountInETH} ETH</p>
                        </div>}
                    </div>}

                    {!nft.activeBuyNow && nft?.activeOffer && <div className="buy-now">
                        <div>
                            <p><span>Active offer</span></p>
                            <p>{nft.activeOffer.amountInETH} ETH</p>
                        </div>
                        {nft.auction && <div>
                            <p><span>Last sold for</span></p>
                            <p>{nft.auction.currentPrice} ETH</p>
                        </div>}
                    </div>}
                </div>
            </div>
        </a>
    )
}

export default NFT;