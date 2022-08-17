import { useEffect, useMemo, useRef } from 'react';
import { useState } from 'react';

import { useBottomScrollListener } from 'react-bottom-scroll-listener';

import './App.css';

// import logo
import logo from './images/logo.png';

import NFT from './NFT';

function App() {
	const [featured, setFeatured] = useState(null);

	const [nftsQueried, setNftsQueried] = useState([]);
	const [nfts, setNFTs] = useState([]);

	const [page, setPage] = useState(0);

	const filterOptions = useMemo(() => {
		return [
			'live_auction',
			'buy_now',
			'reserve_price',
			'active_offer'
		]
	}, [])

	const sort_keys = [
		['most_active', 'artworks_sort_default'],
		['newest', 'artworks_sort_date_minted_desc'],
		['oldest', 'artworks_sort_date_minted_asc'],
		['highest_price', 'artworks_sort_auction_live_price_desc'],
		['lowest_price', 'artworks_sort_auction_live_price_asc'],
	]

	const raws = (page) => {
		return {
			'default': `{"query":"","facetFilters":["moderationStatus:ACTIVE","isDeleted:false","isHidden:false"],"page":${page},"hitsPerPage":48}`,
			'live_auction': `{"query":"","facetFilters":["moderationStatus:ACTIVE","isDeleted:false","isHidden:false","marketAvailability:LIVE_AUCTION"],"page":${page},"hitsPerPage":48}`,
			'buy_now': `{"query":"","facetFilters":["moderationStatus:ACTIVE","isDeleted:false","isHidden:false","marketAvailability:HAS_ACTIVE_BUY_NOW"],"page":${page},"hitsPerPage":48}`,
			'reserve_price': `{"query":"","facetFilters":["moderationStatus:ACTIVE","isDeleted:false","isHidden:false","marketAvailability:RESERVE_NOT_MET"],"page":${page},"hitsPerPage":48}`,
			'active_offer': `{"query":"","facetFilters":["moderationStatus:ACTIVE","isDeleted:false","isHidden:false","marketAvailability:HAS_ACTIVE_OFFER"],"page":${page},"hitsPerPage":48}`,
		}
	}

	const [stats, setStats] = useState({})

	console.log(stats)

	const [filter, setFilter] = useState('default');
	const [sort, setSort] = useState(sort_keys[0][1]);

	const [keyword, setKeyword] = useState('');
	const [keywords, setKeywords] = useState([])

	const [blocked, setBlocked] = useState([]);

	const addKeyword = (event) => {
		event.preventDefault();
		setKeywords([...keywords, event.target.keyword.value])
		setKeyword('');
	}

	const removeKeyword = (keyword) => {
		const newKeywords = keywords.filter(k => k !== keyword);
		setKeywords(newKeywords);
	}

	const handleBlock = (creator) => {
		setBlocked([...blocked, creator]);
	}

	const handleFilterChange = (option) => {
		setNftsQueried([])
		setPage(0)

		if (option === filter) {
			setFilter('default');
		} else {
			setFilter(option);
		}
	}

	const handleSortChange = (event) => {
		setSort(event.target.value);
		setPage(0);
		setNftsQueried([])
	}

	useBottomScrollListener(() => { setPage(page + 1) }, {
		offset: 650,
		debounce: 1000,
		triggerOnNoScroll: false
	});

	useEffect(() => {
		const getStats = () => {
			var myHeaders = new Headers();
			myHeaders.append("Content-Type", "text/plain");

			const _raws = raws(page);

			let sort_key = sort

			if (sort_key === 'reserve_price' || sort_key === 'active_offer')
				sort_key = 'artworks_sort_date_minted_desc'

			// make a request for every filter option
			const requests = filterOptions.map(option => {

				var requestOptions = {
					method: 'POST',
					headers: myHeaders,
					body: _raws[option],
					redirect: 'follow'
				};

				const url = `https://jr5ltvzcse-dsn.algolia.net/1/indexes/${sort_key}/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.12.1)%3B%20Browser%20(lite)&x-algolia-api-key=1ae2d43a2816a05df9d1e053907048bc&x-algolia-application-id=JR5LTVZCSE`

				return fetch(url, requestOptions)
					.then(res => res.json())
			})

			// once all requests are done, process the results by getting the number of hits for each request and save it into the stats array
			Promise.all(requests)
				.then(responses => {
					let _stats = {};
					responses.forEach((response, index) => {
						if(index === 3) {
							setFeatured(response.hits[0])
							console.log(filterOptions[index])
						}
						_stats[filterOptions[index]] = response.nbHits;
					})

					setStats(_stats);
				})
		}

		getStats();
	}, [filterOptions, page, sort])

	useEffect(() => {
		const getNFTs = () => {
			var myHeaders = new Headers();
			myHeaders.append("Content-Type", "text/plain");

			const _raws = raws(page);

			let sort_key = sort


			if (filter === 'reserve_price') {
				if (sort === 'highest_price')
					sort_key = 'artworks_sort_auction_reserve_price_asc'
				if (sort === 'lowest_price')
					sort_key = 'artworks_sort_auction_reserve_price_asc'
			}

			var requestOptions = {
				method: 'POST',
				headers: myHeaders,
				body: _raws[filter],
				redirect: 'follow'
			};

			const url = `https://jr5ltvzcse-dsn.algolia.net/1/indexes/${sort_key}/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.12.1)%3B%20Browser%20(lite)&x-algolia-api-key=1ae2d43a2816a05df9d1e053907048bc&x-algolia-application-id=JR5LTVZCSE`

			fetch(url, requestOptions)
				.then(response => response.json())
				.then(result => {
					setNftsQueried(nftsQueried => [...nftsQueried, ...result['hits']])
				})
				.catch(error => console.log('error', error));
		}

		getNFTs();
	}, [filter, sort, page])

	useEffect(() => {
		const processNFTs = () => {
			// make sure the creator has their account setup
			let _nfts = nftsQueried.filter(nft => {
				return nft.creator.username !== null
			})

			// make sure the description does not tain any of the keywords
			_nfts = _nfts.filter(nft => {
				if (nft.description === null || keywords.length === 0) {
					return true;
				}

				const description = nft.description.toLowerCase();

				return keywords.every(keyword => {
					return !description.includes(keyword.toLowerCase());
				})
			})

			// make sure that none of the tags contain any of the keywords
			_nfts = _nfts.filter(nft => {
				if (nft.tags === null || keywords.length === 0) {
					return true;
				}

				return nft.tags.every(tag => {
					return !keywords.some(keyword => {
						return tag.toLowerCase().includes(keyword.toLowerCase());
					})
				})
			})

			// make sure that the creators username is not in the blocked list
			_nfts = _nfts.filter(nft => {
				return !blocked.includes(nft.creator.username)
			})

			setNFTs(_nfts)
		}

		processNFTs();
	}, [nftsQueried, keywords, blocked])

	const [isSticky, setSticky] = useState(false);
	const ref = useRef(null);

	const handleScroll = () => {
		if (ref.current) {
			setSticky(ref.current.getBoundingClientRect().top <= 0);
		}
	};

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', () => handleScroll);
		};
	}, []);


	return (
		<div className="container">
			{/* navbar */}
			<div className="navbar">
				<div className="navbar-left">
					<img src={logo} alt="logo" style={{
						width: 50,
						marginTop: 20
					}} />
				</div>
			</div>

			<hr style={{ marginBottom: 20 }} />

			<div className="hero">
				<div className="hero-text">
					<h1>Browse Foundation the way it was intended.</h1>
					<p>Cut out all the bullshit and find the beautiful (or ugly) pieces of art that you're looking for. We don't judge here.</p>

					{/* <div style={{
						marginTop: 40,
					}}>
						<button className="secondary">Submit to be featured</button>
					</div> */}
				</div>

				<div className="hero-featured">
					{nfts.length > 1 && <NFT nft={featured} />}
				</div>
			</div>

			<div className={`sticky-wrapper${isSticky ? ' sticky' : ''}`} ref={ref}>
				<hr />

				<div className="toolbar">
					<div className="filter">
						{filterOptions.map((option, index) => {
							return (
								<button
									key={index}
									onClick={() => handleFilterChange(option)}
									className={filter === option ? 'active' : ''}
								>
									{option.replace("_", " ")}
								</button>
							)
						})}
					</div>

					<div className="sort">
						<div className='select'>
							<select onChange={handleSortChange}>
								{sort_keys.map(key => {
									return <option key={key} value={key[1]}>{key[0].replace("_", " ")}</option>
								})}
							</select>
						</div>
					</div>

					<div className="keyword-exclusion">
						<div className="keywords-input">
							<form onSubmit={addKeyword}>
								<input type="text" placeholder="EXCLUDE KEYWORD..." name="keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
							</form>
						</div>

						<div className="keywords">
							{keywords && keywords.map((keyword, index) => {
								return (
									<button
										key={index}
										onClick={() => removeKeyword(keyword)}
										className="keyword"
									>
										{keyword}
									</button>
								)
							})}
						</div>
					</div>
				</div>

				<hr />
			</div>

			<div className="nfts">
				{nfts && nfts.map((nft, idx) => {
					return <div key={idx} >
						<NFT nft={nft} handleBlock={handleBlock} />
					</div>
				})}
			</div>

			<div className="load">
				<button onClick={() => setPage(page + 1)}>Load more</button>
			</div>

			<div className="footer">
				<p>A solution by <a href="https://twitter.com/nftchance">CHANCE</a></p>
			</div>
		</div>
	);
}

export default App;
