import React from 'react';
import PureRenderComponent from '../components/PureRenderComponent';

export default class NotFoundPage extends PureRenderComponent {
    render() {
        return <span>{'[页面不存在 ...]'}</span>;
    }
}
