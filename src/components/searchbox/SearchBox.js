import React from 'react'
import PureRenderComponent from '../PureRenderComponent';
import './SearchBox.less';

export default class SearchBox extends PureRenderComponent {

    constructor(props) {
        super(props);
    }

    render() {
        var props = this.props;
        return (
            <div className="comp-searcher ActionArea">
                <div className="search-container">
                    <input {...props} />
                </div>
            </div>
        );
    }

}