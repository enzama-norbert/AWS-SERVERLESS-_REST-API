import json
import boto3
from botocore.exceptions import ClientError
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from datetime import datetime

# Initialize the DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
dynamodb_table = dynamodb.Table('todos')

status_check_path = '/status'
todo_path = '/todo'
todos_path = '/todos'

def lambda_handler(event, context):
    print('Request event: ', event)
    response = None
   
    try:
        http_method = event.get('httpMethod')
        path = event.get('path')

        if http_method == 'GET' and path == status_check_path:
            response = build_response(200, 'Service is operational')
        elif http_method == 'GET' and path == todo_path:
            todo_id = event['queryStringParameters']['todoid']
            response = get_todo(todo_id)
        elif http_method == 'GET' and path == todos_path:
            response = get_todos()
        elif http_method == 'POST' and path == todo_path:
            response = save_todo(json.loads(event['body']))
        elif http_method == 'PATCH' and path == todo_path:
            body = json.loads(event['body'])
            response = modify_todo(body['todoId'], body['updateKey'], body['updateValue'])
        elif http_method == 'DELETE' and path == todo_path:
            body = json.loads(event['body'])
            response = delete_todo(body['todoId'])
        else:
            response = build_response(404, '404 Not Found')

    except Exception as e:
        print('Error:', e)
        response = build_response(400, 'Error processing request')
   
    return response

def get_todo(todo_id):
    try:
        response = dynamodb_table.get_item(Key={'todoid': todo_id})
        return build_response(200, response.get('Item'))
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def get_todos():
    try:
        scan_params = {
            'TableName': dynamodb_table.name
        }
        return build_response(200, scan_dynamo_records(scan_params, []))
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def scan_dynamo_records(scan_params, item_array):
    response = dynamodb_table.scan(**scan_params)
    item_array.extend(response.get('Items', []))
   
    if 'LastEvaluatedKey' in response:
        scan_params['ExclusiveStartKey'] = response['LastEvaluatedKey']
        return scan_dynamo_records(scan_params, item_array)
    else:
        return {'todos': item_array}

def save_todo(request_body):
    try:
        # Add timestamp if not provided
        if 'createdAt' not in request_body:
            request_body['createdAt'] = datetime.utcnow().isoformat()
        
        dynamodb_table.put_item(Item=request_body)
        body = {
            'Operation': 'SAVE',
            'Message': 'SUCCESS',
            'Item': request_body
        }
        return build_response(200, body)
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def modify_todo(todo_id, update_key, update_value):
    try:
        # Handle empty description case
        if update_key == 'description' and update_value == '':
            update_value = ' '  # DynamoDB doesn't allow empty strings
            
        response = dynamodb_table.update_item(
            Key={'todoid': todo_id},
            UpdateExpression=f'SET {update_key} = :value',
            ExpressionAttributeValues={':value': update_value},
            ReturnValues='UPDATED_NEW'
        )
        
        # If updating description with space, set it back to empty
        if update_key == 'description' and update_value == ' ':
            response['Attributes'][update_key] = ''
        
        body = {
            'Operation': 'UPDATE',
            'Message': 'SUCCESS',
            'UpdatedAttributes': response
        }
        return build_response(200, body)
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

def delete_todo(todo_id):
    try:
        response = dynamodb_table.delete_item(
            Key={'todoid': todo_id},
            ReturnValues='ALL_OLD'
        )
        body = {
            'Operation': 'DELETE',
            'Message': 'SUCCESS',
            'Item': response
        }
        return build_response(200, body)
    except ClientError as e:
        print('Error:', e)
        return build_response(400, e.response['Error']['Message'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            else:
                return float(obj)
        return super(DecimalEncoder, self).default(obj)

def build_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }