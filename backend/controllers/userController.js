const bcrypt = require('bcrypt');
const { query, pool } = require('../config/db');
const mobilePattern = /^\+91[6-9][0-9]{9}$/;
const userFields = 'id, email, role, full_name, mobile_number, is_active, created_at';
const addressFields = 'id, full_name, mobile_number, address_line1, address_line2, city, state, pin_code, country, address_type, is_default';
const fail = (res, status, message) => res.status(status).json({status:'error', message});
const ok = (res, data, status=200) => res.status(status).json({status:'success', data});
const validText = (v,max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max && !v.includes('\0');
const validMobile = v => typeof v === 'string' && mobilePattern.test(v.trim());
const validId = v => typeof v === 'string' && /^[1-9][0-9]{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n;
const wrap = fn => async (req,res) => { try { await fn(req,res); } catch { fail(res,500,'Unable to complete account request'); } };
const updateProfile = wrap(async (req,res) => {
 const {full_name,mobile_number} = req.body || {};
 if (!validText(full_name,255) || !validMobile(mobile_number)) return fail(res,400,'Enter a valid name and Indian mobile number (+91).');
 const result = await query(`UPDATE users SET full_name=$1,mobile_number=$2,updated_at=now() WHERE id=$3 AND is_active RETURNING ${userFields}`, [full_name.trim(),mobile_number.trim(),req.user.id]);
 if (!result.rowCount) return fail(res,401,'Account unavailable');
 ok(res,{user:result.rows[0]});
});
const changePassword = wrap(async (req,res) => {
 const {current_password,new_password,confirm_password} = req.body || {};
 if (typeof current_password !== 'string' || !current_password || Buffer.byteLength(current_password)>72 || typeof new_password !== 'string' || new_password.length<8 || Buffer.byteLength(new_password)>72 || new_password!==confirm_password || current_password===new_password) return fail(res,400,'Enter matching new passwords (8 characters minimum, 72 bytes maximum), different from the current password.');
 const result=await query('SELECT password_hash FROM users WHERE id=$1 AND is_active',[req.user.id]);
 if (!result.rowCount) return fail(res,401,'Account unavailable');
 const old=result.rows[0].password_hash;
 if (!await bcrypt.compare(current_password,old)) return fail(res,400,'Current password is incorrect');
 const hash=await bcrypt.hash(new_password,12);
 const updated=await query('UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2 AND password_hash=$3 AND is_active',[hash,req.user.id,old]);
 if (!updated.rowCount) return fail(res,409,'Password changed concurrently. Please try again.');
 ok(res,{message:'Password updated successfully'});
});
function addressValues(body={}) {
 const {full_name,mobile_number,address_line1,address_line2='',city,state,pin_code,address_type}=body || {};
 if (!validText(full_name,255)||!validMobile(mobile_number)||!validText(address_line1,255)||typeof address_line2!=='string'||address_line2.trim().length>255||address_line2.includes('\0')||!validText(city,100)||!validText(state,100)||typeof pin_code!=='string'||! /^[1-9][0-9]{5}$/.test(pin_code.trim())||!['Home','Work','Other'].includes(address_type)) return null;
 return [full_name,mobile_number,address_line1,address_line2,city,state,pin_code,address_type].map(v=>v.trim());
}
// Serialize address mutations for each owner, including default changes.
async function transaction(userId,fn) {
 const client=await pool.connect();
 try { await client.query('BEGIN'); await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[userId]); const value=await fn(client); await client.query('COMMIT'); return value; }
 catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
}
const listAddresses=wrap(async(req,res)=>{const r=await query(`SELECT ${addressFields} FROM user_addresses WHERE user_id=$1 ORDER BY is_default DESC,id`,[req.user.id]);ok(res,{addresses:r.rows});});
const addAddress=wrap(async(req,res)=>{
 const values=addressValues(req.body);if(!values)return fail(res,400,'Enter valid delivery address details.');
 const address=await transaction(req.user.id,async c=>{const r=await c.query(`INSERT INTO user_addresses (user_id,full_name,mobile_number,address_line1,address_line2,city,state,pin_code,address_type,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOT EXISTS (SELECT 1 FROM user_addresses WHERE user_id=$1)) RETURNING ${addressFields}`,[req.user.id,...values]);return r.rows[0];});ok(res,{address},201);
});
const editAddress=wrap(async(req,res)=>{
 if(!validId(req.params.id))return fail(res,400,'Invalid address ID');const values=addressValues(req.body);if(!values)return fail(res,400,'Enter valid delivery address details.');
 const r=await transaction(req.user.id,c=>c.query(`UPDATE user_addresses SET full_name=$1,mobile_number=$2,address_line1=$3,address_line2=$4,city=$5,state=$6,pin_code=$7,address_type=$8,updated_at=now() WHERE user_id=$9 AND id=$10 RETURNING ${addressFields}`,[...values,req.user.id,req.params.id]));if(!r.rowCount)return fail(res,404,'Address not found');ok(res,{address:r.rows[0]});
});
const deleteAddress=wrap(async(req,res)=>{
 if(!validId(req.params.id))return fail(res,400,'Invalid address ID');const found=await transaction(req.user.id,async c=>{const r=await c.query('DELETE FROM user_addresses WHERE user_id=$1 AND id=$2 RETURNING is_default',[req.user.id,req.params.id]);if(!r.rowCount)return false;if(r.rows[0].is_default)await c.query('UPDATE user_addresses SET is_default=true,updated_at=now() WHERE id=(SELECT id FROM user_addresses WHERE user_id=$1 ORDER BY id LIMIT 1)',[req.user.id]);return true;});if(!found)return fail(res,404,'Address not found');ok(res,{message:'Address deleted'});
});
const defaultAddress=wrap(async(req,res)=>{
 if(!validId(req.params.id))return fail(res,400,'Invalid address ID');const found=await transaction(req.user.id,async c=>{const r=await c.query('SELECT id FROM user_addresses WHERE user_id=$1 AND id=$2',[req.user.id,req.params.id]);if(!r.rowCount)return false;await c.query('UPDATE user_addresses SET is_default=false,updated_at=now() WHERE user_id=$1 AND is_default',[req.user.id]);await c.query('UPDATE user_addresses SET is_default=true,updated_at=now() WHERE user_id=$1 AND id=$2',[req.user.id,req.params.id]);return true;});if(!found)return fail(res,404,'Address not found');ok(res,{message:'Default address updated'});
});
module.exports={updateProfile,changePassword,listAddresses,addAddress,editAddress,deleteAddress,defaultAddress};
