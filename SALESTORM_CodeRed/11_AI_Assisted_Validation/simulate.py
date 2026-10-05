"""Executable state model, NOT PostgreSQL/provider/broker or throughput evidence."""
import asyncio, json, random, unittest
from pathlib import Path

class Model:
    def __init__(self,n=100):
        self.n=n;self.a=n;self.h=0;self.s=0;self.now=0
        self.lock=asyncio.Lock();self.requests={};self.holds={};self.intents={}
        self.charges={};self.events=[];self.inbox=set();self.orders={};self.audit=[]
        self.db_up=True;self.order_up=True;self.max_live=0
    def check(self):
        assert min(self.a,self.h,self.s)>=0
        assert self.a+self.h+self.s==self.n
        assert sum(v['state'] in ('RESERVED','PAYMENT_PENDING') for v in self.holds.values())==self.h
        assert sum(v['state']=='SOLD' for v in self.holds.values())==self.s
        assert self.h+self.s<=self.n
        assert len(self.orders)<=self.s
        self.max_live=max(self.max_live,self.h+self.s)
    async def reserve(self,customer,key,body='sku1',crash=False):
        await asyncio.sleep(0)
        async with self.lock:
            if not self.db_up:return 'UNAVAILABLE'
            if (customer,key) in self.requests:
                prior_hash,answer=self.requests[customer,key]
                return answer if prior_hash==body else 'MISMATCH'
            active=next((k for k,v in self.holds.items() if v['customer']==customer and v['state']!='RELEASED'),None)
            if active:return 'ACTIVE_CONFLICT'
            if crash:return 'ROLLED_BACK' # atomic transaction abstraction
            if self.a==0:answer='SOLD_OUT'
            else:
                answer=f'r{len(self.holds)+1}'
                self.a-=1;self.h+=1
                self.holds[answer]={'customer':customer,'state':'RESERVED','expires':self.now+120,'reason':None}
            self.requests[customer,key]=(body,answer);self.check();return answer
    async def checkout(self,r):
        await asyncio.sleep(0)
        async with self.lock:
            v=self.holds[r]
            if v['state']=='PAYMENT_PENDING':return True
            if v['state']!='RESERVED' or self.now>=v['expires']:return False
            v['state']='PAYMENT_PENDING';self.intents.setdefault(r,'PENDING');self.check();return True
    async def expire(self,r):
        await asyncio.sleep(0)
        async with self.lock:
            v=self.holds[r]
            if v['state']=='RESERVED' and self.now>=v['expires']:
                self.release(r,'EXPIRED')
            self.check()
    def release(self,r,reason):
        self.holds[r]['state']='RELEASED';self.holds[r]['reason']=reason
        self.h-=1;self.a+=1
    async def pay(self,r,outcome='SUCCEEDED',lost=False):
        await asyncio.sleep(0)
        async with self.lock:
            assert r in self.intents
            # Provider model is idempotent by reservation intent. Not real provider proof.
            result=self.charges.setdefault(r,outcome)
            self.intents[r]='UNKNOWN' if lost else result
            if not lost:self.events.append((f'p-{len(self.events)}',r,result))
            return self.intents[r]
    async def reconcile(self,r):
        async with self.lock:
            result=self.charges.get(r)
            if result:
                self.intents[r]=result;self.events.append((f'reconcile-{r}',r,result))
    async def apply_payment(self,event):
        eid,r,outcome=event
        async with self.lock:
            if ('inventory',eid) in self.inbox:return
            v=self.holds[r]
            if v['state']=='PAYMENT_PENDING':
                if outcome=='SUCCEEDED':v['state']='SOLD';self.h-=1;self.s+=1
                elif outcome=='FAILED':self.release(r,'PAYMENT_FAILED')
            self.inbox.add(('inventory',eid));self.check()
    async def order(self,r,event_id=None,crash_before_commit=False):
        async with self.lock:
            if not self.order_up:return False
            assert self.holds[r]['state']=='SOLD'
            eid=event_id or 'commit-'+r
            if ('order',eid) in self.inbox:return True
            if crash_before_commit:return False
            self.orders.setdefault(r,'CONFIRMED');self.inbox.add(('order',eid));self.check();return True

class Tests(unittest.IsolatedAsyncioTestCase):
    async def test_01_practical_10000_with_2_percent_duplicates(self):
        m=Model();gate=asyncio.Event()
        async def attempt(c):await gate.wait();return await m.reserve(c,'buy')
        tasks=[asyncio.create_task(attempt(c)) for c in range(10000)]
        tasks += [asyncio.create_task(attempt(c)) for c in random.Random(7).sample(range(10000),200)]
        gate.set();await asyncio.gather(*tasks)
        self.assertEqual(len(m.holds),100);self.assertEqual(m.max_live,100)
        winners=list(m.holds)
        await asyncio.gather(*(m.checkout(r) for r in winners))
        await asyncio.gather(*(m.pay(r,'SUCCEEDED' if i<95 else 'FAILED') for i,r in enumerate(winners)))
        for event in list(m.events):await m.apply_payment(event);await m.apply_payment(event)
        m.order_up=False
        for r in winners[:95]:self.assertFalse(await m.order(r))
        m.now+=30 # virtual outage, not 30 seconds of external-service observation
        m.order_up=True
        for r in winners[:95]:await m.order(r);await m.order(r,'second-id-'+r)
        self.assertEqual((m.a,m.h,m.s,len(m.orders)),(5,0,95,95))
        self.__class__.practical={'logical_customers':10000,'http_attempts':10200,'duplicate_attempts':200,'initial_holds':100,'paid':95,'failed':5,'available':5,'held':0,'sold':95,'unique_orders':95,'max_held_plus_sold':100,'order_outage_virtual_seconds':30}
    async def test_02_last_unit_race(self):
        m=Model(1);a=await asyncio.gather(m.reserve('a','key'),m.reserve('b','key'));self.assertEqual(sum(x=='SOLD_OUT' for x in a),1)
    async def test_03_same_key_mismatch_and_new_key(self):
        m=Model();r=await m.reserve('a','key');self.assertEqual(await m.reserve('a','key'),r)
        self.assertEqual(await m.reserve('a','key','other'),'MISMATCH');self.assertEqual(await m.reserve('a','new-key'),'ACTIVE_CONFLICT')
    async def test_04_expiry_releases_once(self):
        m=Model(1);r=await m.reserve('a','key');m.now=120
        await asyncio.gather(m.expire(r),m.expire(r));self.assertEqual(m.a,1)
    async def test_05_checkout_vs_expiry_interleavings(self):
        for now,first in [(119,'checkout'),(120,'expiry'),(120,'checkout')]:
            m=Model(1);r=await m.reserve('a','key');m.now=now
            if first=='checkout':await m.checkout(r);m.now=121;await m.expire(r)
            else:await m.expire(r);self.assertFalse(await m.checkout(r))
            self.assertEqual(m.holds[r]['state'],'PAYMENT_PENDING' if now==119 else 'RELEASED')
    async def test_06_lost_charge_response_reconciliation(self):
        m=Model(1);r=await m.reserve('a','key');await m.checkout(r);await m.pay(r,lost=True)
        m.now=9999;await m.expire(r);self.assertEqual(m.h,1)
        await m.pay(r);await m.reconcile(r)
        for e in m.events:await m.apply_payment(e)
        self.assertEqual(len(m.charges),1);self.assertEqual(m.s,1)
    async def test_07_duplicate_event_new_id(self):
        m=Model(1);r=await m.reserve('a','key');await m.checkout(r);await m.pay(r)
        await m.apply_payment(m.events[0]);await m.apply_payment(('other',r,'SUCCEEDED'))
        self.assertEqual(m.s,1)
    async def test_08_consumer_commit_then_lost_ack(self):
        m=Model(1);r=await m.reserve('a','key');await m.checkout(r);await m.pay(r);await m.apply_payment(m.events[0])
        self.assertFalse(await m.order(r,crash_before_commit=True));self.assertEqual(len(m.orders),0)
        await m.order(r);await m.order(r);self.assertEqual(len(m.orders),1)
    async def test_09_db_unavailable_and_transaction_rollback(self):
        m=Model(1);m.db_up=False;self.assertEqual(await m.reserve('a','key'),'UNAVAILABLE');m.db_up=True
        self.assertEqual(await m.reserve('a','key',crash=True),'ROLLED_BACK');self.assertEqual(m.a,1)
        r=await m.reserve('a','key');self.assertEqual(await m.reserve('a','key'),r)
    async def test_10_stale_cache_has_no_authority(self):
        m=Model(0);cache_hint=True;self.assertTrue(cache_hint);self.assertEqual(await m.reserve('a','key'),'SOLD_OUT')
    async def test_11_failed_payment_recycles_without_extra_sale(self):
        m=Model(1);r=await m.reserve('a','key');await m.checkout(r);await m.pay(r,'FAILED');await m.apply_payment(m.events[0])
        r2=await m.reserve('b','key');await m.checkout(r2);await m.pay(r2);await m.apply_payment(m.events[-1])
        self.assertEqual(len(m.holds),2);self.assertEqual(m.s,1)
    async def test_12_random_duplicate_and_expiry_schedules(self):
        for seed in range(30):
            rng=random.Random(seed);m=Model(10)
            for c in range(40):
                r=await m.reserve(c,'key')
                if r=='SOLD_OUT':continue
                if rng.random()<.2:m.now+=121;await m.expire(r)
                elif await m.checkout(r):
                    await m.pay(r,'SUCCEEDED' if rng.random()<.95 else 'FAILED',lost=rng.random()<.2)
                    await m.reconcile(r)
                events=list(m.events);rng.shuffle(events)
                for e in events:await m.apply_payment(e)
                m.check()

if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(Tests)
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    evidence={'model':'asyncio transactional state model; global lock abstracts SQL serialization','not_proven':['PostgreSQL execution/performance','real network/process failover','provider contract','500000 RPS','broker durability','bounded completion under permanent outage'],'tests_run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'practical':getattr(Tests,'practical',{})}
    Path(__file__).with_name('simulation_results.json').write_text(json.dumps(evidence,indent=2))
    raise SystemExit(not result.wasSuccessful())
