import { useContext } from 'react'

import { createNamedContext, ParamsContext } from './internal'

export const PageLoadingContext = createNamedContext('PageLoading')

export const usePageLoadingContext = () => useContext(PageLoadingContext)

export class PageLoader extends React.PureComponent {
  state = {
    Page: undefined,
    pageName: undefined,
    slowModuleImport: false,
  }

  shouldActivate = (p1, p2) => {
    if (p1.spec.name !== p2.spec.name) {
      return true
    }
    if (JSON.stringify(p1.params) !== JSON.stringify(p2.params)) {
      return true
    }
    return false
  }

  componentDidMount() {
    this.startPageLoadTransition()
  }

  componentDidUpdate(prevProps) {
    if (this.shouldActivate(prevProps, this.props)) {
      this.clearLoadingTimeout()
      this.startPageLoadTransition()
    }
  }

  clearLoadingTimeout = () => {
    clearTimeout(this.loadingTimeout)
  }

  startPageLoadTransition = async () => {
    const { spec, delay } = this.props
    const { loader, name } = spec

    // Update the context if importing the page is taking longer
    // than `delay`.
    // Consumers of the context can show a loading indicator
    // to signal to the user that something is happening.
    this.loadingTimeout = setTimeout(
      () => this.setState({ slowModuleImport: true }),
      delay
    )

    // Wait to download and parse the page.
    const module = await loader()

    // Remove the timeout because the page has loaded.
    this.clearLoadingTimeout()

    this.setState({
      pageName: name,
      Page: module.default,
      slowModuleImport: false,
      params: this.props.params,
    })
  }

  render() {
    const { Page } = this.state
    if (Page) {
      return (
        <ParamsContext.Provider value={this.state.params}>
          <PageLoadingContext.Provider
            value={{ loading: this.state.slowModuleImport }}
          >
            <Page {...this.state.params} />
          </PageLoadingContext.Provider>
        </ParamsContext.Provider>
      )
    } else {
      return null
    }
  }
}
