import { useEffect, useState } from 'react';

import { LazyLoadComponent } from 'react-lazy-load-image-component';

import "./NFT.css";

const NFT = ({ nft, handleBlock }) => {
    const isActive = nft.activeOffer || nft.activeBuyNow

    const openInNewTab = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const [endsIn, setEndsIn] = useState(0);

    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => { 
        if(!nft?.auction) return

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
        <a href={`https://foundation.app/@${nft.creator.username}/${nft.collection.slug}/${nft.tokenId}`} target="_blank" rel="noreferrer">
            <div className="nft">
                <div className="nft-image">
                    <LazyLoadComponent id={nft.id}>
                        <div className="nft-image" style={{
                            backgroundImage: `url(${nft.assetScheme}${nft.assetHost}${nft.assetPath})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            width: '100%',
                            minHeight: 300,
                        }} />
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

                    {!nft.activeBuyNow && nft.activeOffer && <div className="buy-now">
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