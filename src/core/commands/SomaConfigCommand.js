import axios from 'axios';
import trim from 'lodash/trim';
import {createCommand} from '../../utils/command';
import SomaConfigStore from '../../core/stores/SomaConfigStore';


export const gerSomaConfigCmd = createCommand(function () {
    return axios({
        url: "/soma.cfg"
    }).then(({data}) => {

        var result = {};
        var lines =  data.split('\n') ||[];

        for(var i=0;i<lines.length;i++){
            var line = lines[i] || '';
            var kv = line.split('=') || [];
            var key = trim(kv[0]||"");
            var value = trim(kv[1]||"");
            if(key && value){
                result[key] = value;
            }
        }


        SomaConfigStore.onSaveConfig(result);

    });
});