
use crate::types::{ChainState, NftMetadata};
use uuid::Uuid;

pub fn mint_nft(
    chain: &mut ChainState,
    creator: &str,
    name: &str,
    desc: &str,
    image: &str,
    category: &str,
) -> Result<NftMetadata, String> {
    let nft = NftMetadata {
        id: Uuid::new_v4().to_string(),
        creator: creator.to_string(),
        name: name.to_string(),
        description: desc.to_string(),
        image_url: image.to_string(),
        category: category.to_string(),
    };

    let account = chain.accounts.entry(creator.to_string()).or_default();
    account.owned_nfts.push(nft.clone());

    Ok(nft)
}
