'use client';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { GeoJSONSource, Map as LibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plus, Minus, LocateFixed, Mountain, Layers, House, Route, School, Hospital, Waves, ChevronDown, Crosshair } from 'lucide-react';
import { basins, ScenarioParams, SimulationResult } from '@/lib/simulation';
export type LayerState = Record<string, boolean>;
const layerItems = [{key:'settlements',label:'Settlements',icon:House,color:'#ea945a'},{key:'roads',label:'Roads',icon:Route,color:'#bc9565'},{key:'bridges',label:'Bridges',icon:Route,color:'#8792a4'},{key:'schools',label:'Schools',icon:School,color:'#5c83ac'},{key:'hospitals',label:'Hospitals',icon:Hospital,color:'#cc6574'},{key:'river',label:'River',icon:Waves,color:'#4a9bc1'},{key:'flood',label:'Inundation zone',icon:Layers,color:'#ec7776'}];
function floodGeometry(params: ScenarioParams, result: SimulationResult, minute: number) {
  const route = basins[params.river].route;
  const progress = Math.min(route.length-1, minute / 60 * (route.length-1) * result.velocity);
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  for(let i=0;i<Math.ceil(progress);i++) {
    const a=route[i], dest=route[i+1]; if(!dest) break;
    const f=Math.min(1,progress-i), b=[a[0]+(dest[0]-a[0])*f,a[1]+(dest[1]-a[1])*f];
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.sqrt(dx*dx+dy*dy)||1;
    const width=.0048*Math.sqrt(result.severity)*(1+i*.03),nx=-dy/length*width,ny=dx/length*width;
    const polygon=[[a[0]+nx,a[1]+ny],[b[0]+nx*1.15,b[1]+ny*1.15],[b[0]+dx*.13,b[1]+dy*.13],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],[a[0]-dx*.15,a[1]-dy*.15],[a[0]+nx,a[1]+ny]];
    features.push({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[polygon]}});
  }
  return {type:'FeatureCollection' as const,features};
}
export default function BasinMap({params,result,minute,layers,setLayers,terrain,setTerrain}:{params:ScenarioParams;result:SimulationResult;minute:number;layers:LayerState;setLayers:(v:LayerState)=>void;terrain:boolean;setTerrain:(v:boolean)=>void}) {
  const container=useRef<HTMLDivElement>(null), mapRef=useRef<LibreMap|null>(null), markers=useRef<{marker:maplibregl.Marker;kind:string}[]>([]);
  const [ready,setReady]=useState(false), [floodReady,setFloodReady]=useState(false), [collapsed,setCollapsed]=useState(false), [mapError,setMapError]=useState(false);
  const latest=useRef({params,result,minute}); latest.current={params,result,minute};
  useEffect(()=>{
    if(!container.current)return;
    maplibregl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs');
    maplibregl.setWorkerCount(2);
    const map=new maplibregl.Map({container:container.current,center:basins[params.river].center,zoom:11.3,maxZoom:17,minZoom:7,attributionControl:false,style:{version:8,sources:{topo:{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],tileSize:256,attribution:'Esri, USGS, OpenStreetMap'},hillshade:{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'],tileSize:256}},layers:[{id:'base',type:'raster',source:'topo',paint:{'raster-saturation':-.45,'raster-contrast':-.12}},{id:'shading',type:'raster',source:'hillshade',paint:{'raster-opacity':.19}}]}});
    mapRef.current=map;
    map.on('sourcedata',event=>{if(event.sourceId==='flood' && event.isSourceLoaded)setFloodReady(true)});
    map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
    map.on('load',()=>{
      map.setPaintProperty('base','raster-opacity',.68);
      const current=latest.current;
      map.addSource('river',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:basins[current.params.river].route}}});
      map.addSource('flood',{type:'geojson',data:floodGeometry(current.params,current.result,current.minute)});
      map.addLayer({id:'flood-fill',type:'fill',source:'flood',paint:{'fill-color':'#f1817a','fill-opacity':.4}});
      map.addLayer({id:'flood-outline',type:'line',source:'flood',paint:{'line-color':'#e97670','line-width':1.3,'line-opacity':.5}});
      map.addLayer({id:'river-line',type:'line',source:'river',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#529cba','line-width':4,'line-opacity':.9}});
      map.addSource('roads',{type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates:basins[current.params.river].route.map(([x,y],i)=>[x+.012+(i%2)*.003,y-.003])}}});
      map.addLayer({id:'road-line',type:'line',source:'roads',paint:{'line-color':'#bca17a','line-width':2,'line-dasharray':[3,2]}});
      setReady(true);
    });
    map.on('error',e=>{if(e.error.message.includes('WebGL'))setMapError(true)});
    const observer=new ResizeObserver(()=>{map.resize();if(map.getSource('river')){const basin=basins[latest.current.params.river],compact=map.getContainer().clientWidth<500;map.stop();map.fitBounds([basin.route[0],basin.route[basin.route.length-1]],{padding:{top:115,bottom:95,left:compact?65:130,right:compact?45:110},duration:0,maxZoom:12});}});observer.observe(container.current);
    return()=>{observer.disconnect();markers.current.forEach(m=>m.marker.remove());map.remove();mapRef.current=null;};
  // Map instance is intentionally initialized only once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!ready)return;
    const basin=basins[params.river];
    (map.getSource('river') as GeoJSONSource).setData({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:basin.route}});
    (map.getSource('roads') as GeoJSONSource).setData({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:basin.route.map(([x,y],i)=>[x+.012+(i%2)*.003,y-.003])}});
    map.fitBounds([basin.route[0],basin.route[basin.route.length-1]],{padding:{top:115,bottom:95,left:130,right:110},duration:900,maxZoom:12});
    markers.current.forEach(m=>m.marker.remove());markers.current=[];
    const add=(coord:[number,number],html:string,kind:string,popup?:string)=>{
      const el=document.createElement('div');el.className=`map-marker ${kind}`;el.innerHTML=html;
      const marker=new maplibregl.Marker({element:el,anchor:'left'}).setLngLat(coord).addTo(map);
      if(popup){el.style.cursor='pointer';marker.setPopup(new maplibregl.Popup({offset:14,closeButton:true}).setHTML(popup));el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label','View settlement impact');el.addEventListener('keydown',e=>{if(e.key==='Enter')marker.togglePopup()});}
      markers.current.push({marker,kind});
    };
    add(basin.route[0],'<span class="source-dot">≋</span><span class="source-label">'+params.source+'<small>BREACH LOCATION</small></span>','source');
    result.settlements.forEach((s,i)=>{const coord=basin.route[s.index];add([coord[0]+.002,coord[1]],'<span class="settlement-dot">⌂</span><span class="village-label">'+s.name+'</span>','settlements',`<strong>${s.name}</strong><p>${s.population.toLocaleString()} residents · illustrative</p><p>Arrival: T+${s.arrival} min · Depth: ${s.depth} m</p>`);
      if(i<3)add([coord[0]+.018,coord[1]+.009],'<span class="facility school">⚑</span>','schools');
      if(i===1||i===3)add([coord[0]-.014,coord[1]-.007],'<span class="facility hospital">+</span>','hospitals');
      add([coord[0]-.003,coord[1]-.008],'<span class="facility bridge">Ⅱ</span>','bridges');
    });
  },[ready,params.river,params.source,result]);
  useEffect(()=>{if(ready&&mapRef.current)(mapRef.current.getSource('flood') as GeoJSONSource).setData(floodGeometry(params,result,minute));},[minute,params,result,ready]);
  useEffect(()=>{const map=mapRef.current;if(!map||!ready)return;[['river-line','river'],['flood-fill','flood'],['flood-outline','flood'],['road-line','roads']].forEach(([id,key])=>map.setLayoutProperty(id,'visibility',layers[key]?'visible':'none'));markers.current.forEach(({marker,kind})=>{marker.getElement().style.display=kind==='source'||layers[kind]?'':'none'});map.setPaintProperty('shading','raster-opacity',terrain?.22:0);map.setPaintProperty('base','raster-saturation',terrain?-.45:-1);},[layers,ready,terrain,result]);
  const resetView=()=>{const basin=basins[params.river];mapRef.current?.fitBounds([basin.route[0],basin.route[basin.route.length-1]],{padding:{top:115,bottom:95,left:130,right:110},duration:700,bearing:0,pitch:0})};
  return <div className="map-shell" data-flood-ready={floodReady}>
    <div ref={container} className="map-canvas" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
    {mapError&&<div className="map-error">Map rendering is unavailable. Simulation metrics and timeline remain available.</div>}
    <div className="map-heading"><span className="live-simulation"><i/> SIMULATION VIEW</span><div><b>{params.river.replace(' River','')} River Basin</b><span>{params.river==='Melamchi River'?'Sindhupalchok':params.river==='Dudh Koshi River'?'Solukhumbu':'Rasuwa'}, Nepal <span className="nepal-flag">🇳🇵</span></span></div></div>
    <div className="map-model-tag"><span className="tiny-dot"/> Simplified flood model</div>
    <div className="map-controls"><div className="zoom-group"><button onClick={()=>mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={18}/></button><button onClick={()=>mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={18}/></button></div><button onClick={resetView} aria-label="Reset map view"><LocateFixed size={18}/></button><button className={terrain?'selected':''} onClick={()=>setTerrain(!terrain)} aria-label="Toggle terrain shading"><Mountain size={18}/></button><button onClick={()=>{const map=mapRef.current;if(map)map.easeTo({pitch:map.getPitch()>0?0:45,duration:800})}} aria-label="Toggle perspective"><span className="three-d">3D</span></button></div>
    <div className={'layer-panel '+(collapsed?'collapsed':'')}><button className="layer-title" onClick={()=>setCollapsed(!collapsed)}><span><Layers size={15}/> Map layers</span><ChevronDown size={14} style={{transform:collapsed?'rotate(180deg)':''}}/></button>{!collapsed&&<div className="layer-options">{layerItems.map(({key,label,icon:Icon,color})=><label key={key}><Icon size={14} color={color}/><span>{label}</span><input type="checkbox" checked={layers[key]} onChange={()=>setLayers({...layers,[key]:!layers[key]})}/></label>)}</div>}</div>
    <div className="depth-legend"><b>Flood depth <span>(m)</span></b><div className="depth-colors"/><div className="depth-values"><span>0</span><span>1</span><span>2</span><span>3</span><span>5+</span></div><small>Illustrative inundation extent</small></div>
    <div className="map-scale"><div/> 2 km</div><div className="map-coordinate"><Crosshair size={11}/> {basins[params.river].center[1].toFixed(3)}° N &nbsp; {basins[params.river].center[0].toFixed(3)}° E</div>
  </div>;
}
