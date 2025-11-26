export const Wallet = {
  provider: null,
  signer: null,
  address: null,
  async connect(){
    if(window.ethereum){
      this.provider = new ethers.BrowserProvider(window.ethereum)
      await this.provider.send('eth_requestAccounts', [])
      this.signer = await this.provider.getSigner()
      this.address = await this.signer.getAddress()
      console.log('Connected', this.address)
    } else {
      alert('Install MetaMask or compatible wallet')
    }
  }
}
