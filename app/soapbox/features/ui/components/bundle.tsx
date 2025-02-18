import React from 'react';

const emptyComponent = () => null;
const noop = () => { };

class Bundle extends React.PureComponent<{ fetchComponent: any, loading: any, error: any, renderDelay: any, children: any  }> {

  static defaultProps = {
    loading: emptyComponent,
    error: emptyComponent,
    renderDelay: 0,
    onFetch: noop,
    onFetchSuccess: noop,
    onFetchFail: noop,
  }

  static cache = new Map

  unmounted: boolean = false;
  timeout;
  timestamp: Date;

  state = {
    mod: undefined,
    forceRender: false,
  }

  componentDidMount() {
    this.load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.fetchComponent !== this.props.fetchComponent) {
      this.load(nextProps);
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  load = (props) => {
    const { fetchComponent, onFetch, onFetchSuccess, onFetchFail, renderDelay } = props || this.props;
    const cachedMod = Bundle.cache.get(fetchComponent);

    if (this.unmounted) return Promise.resolve();

    if (fetchComponent === undefined) {
      this.setState({ mod: null });
      return Promise.resolve();
    }

    onFetch();

    if (cachedMod) {
      this.setState({ mod: cachedMod.default });
      onFetchSuccess();
      return Promise.resolve();
    }

    this.setState({ mod: undefined });

    if (renderDelay !== 0) {
      this.timestamp = new Date();
      this.timeout = setTimeout(() => this.setState({ forceRender: true }), renderDelay);
    }

    return fetchComponent()
      .then((mod) => {
        Bundle.cache.set(fetchComponent, mod);
        if (this.unmounted) return;
        this.setState({ mod: mod.default });
        onFetchSuccess();
      })
      .catch((error) => {
        if (this.unmounted) return;
        this.setState({ mod: null });
        onFetchFail(error);
      });
  }

  render() {
    const { loading: Loading, error: Error, children, renderDelay } = this.props;
    const { mod, forceRender } = this.state;
    const elapsed = this.timestamp ? (new Date().getTime() - this.timestamp.getTime()) : renderDelay;

    if (mod === undefined) {
      return (elapsed >= renderDelay || forceRender) ? <Loading /> : null;
    }

    if (mod === null) {
      return <Error onRetry={this.load} />;
    }

    return children(mod);
  }

}

export default Bundle;
