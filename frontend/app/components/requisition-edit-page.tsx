"use client";
import {useRouter} from 'next/navigation';import RequisitionForm from './requisition-form';
type Option={id:string;name:string;allowsFractional?:boolean|null};
type Initial={id:string;requisitionNumber:string;justification:string;currency?:string|null;requiredDate?:string|null;department?:{id:string}|null;lines:{id:string;item?:{id:string};unitOfMeasure?:{id:string};description:string;quantityRequested:string|number;estimatedUnitPrice?:string|number|null;requiredDate?:string|null}[]};
export default function RequisitionEditPage({items,units,departments,initial}:{items:Option[];units:Option[];departments:Option[];initial:Initial}){const router=useRouter();const href=`/workspace/procurement/requisitions/${encodeURIComponent(initial.id)}`;return <RequisitionForm items={items} units={units} departments={departments} optionsAvailable initial={initial} onClose={()=>router.push(href)} onCreated={()=>{router.push(href);router.refresh()}}/>}
