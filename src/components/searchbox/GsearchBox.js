import React from 'react'
import PureRenderComponent from '../PureRenderComponent';
import './GsearchBox.less';

export default class GsearchBox extends PureRenderComponent {

    constructor(props) {
        super(props);
    }

    quitGlobalSearch=()=> {
        this.props.parent.quitGlobalSearch();
    }

    onSearcherChange=(e)=> {
        this.props.parent.onSearcherChange(e);
    }

    onClearSearchText=()=> {
        this.props.parent.onClearSearchText();
        this.refs.searchInput.focus();
    }

    onBlurSearchInput=()=> {
        this.props.parent.onBlurSearchInput();
    }

    onKeyDown=(e)=>{
        if(this.props.parent.onGSearchKeyDown){
            this.props.parent.onGSearchKeyDown(e)
        }
    };

    render() {
        var props = this.props;
        var that = this;
        var searchText = props.searchText;
        var style = props.style || {};
        return (
            <div className="GsearchBox ActionArea" style={style} >
                <div className="search-container">
                    <input ref="searchInput" value={searchText} autoFocus={true} onBlur={that.onBlurSearchInput}
                           onChange={that.onSearcherChange}  onKeyDown={that.onKeyDown} />
                    <div className="ic_back" onClick={that.quitGlobalSearch}></div>

                    {
                        searchText?
                        <div className="ic_delete" onClick={that.onClearSearchText}></div>:
                        <span></span>
                    }

                </div>
            </div>
        );
    }

}